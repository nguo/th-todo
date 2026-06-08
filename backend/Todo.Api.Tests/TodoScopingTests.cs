using System.Net;
using System.Net.Http.Json;

namespace Todo.Api.Tests;

public class TodoScopingTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task User_cannot_touch_another_users_list_or_items()
    {
        // Alice owns a list with one item.
        var alice = factory.CreateClient();
        alice.Authorize((await alice.RegisterAsync()).Token);
        var aliceList = await alice.DefaultListIdAsync();
        var created = await alice.PostAsJsonAsync($"/api/lists/{aliceList}/todos", new { title = "alice task" });
        created.EnsureSuccessStatusCode();
        var item = (await created.Content.ReadFromJsonAsync<ItemResp>())!;

        // Bob is a different user.
        var bob = factory.CreateClient();
        bob.Authorize((await bob.RegisterAsync()).Token);

        // Every verb against Alice's list → 404 (don't leak existence).
        Assert.Equal(HttpStatusCode.NotFound, (await bob.GetAsync($"/api/lists/{aliceList}/todos")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await bob.PostAsJsonAsync($"/api/lists/{aliceList}/todos", new { title = "x" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await bob.PutAsJsonAsync($"/api/lists/{aliceList}/todos/{item.Id}", new { isCompleted = true })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await bob.DeleteAsync($"/api/lists/{aliceList}/todos/{item.Id}")).StatusCode);

        // Even using Alice's item id under Bob's OWN list → 404 (item isn't in that list).
        var bobList = await bob.DefaultListIdAsync();
        Assert.Equal(HttpStatusCode.NotFound, (await bob.PutAsJsonAsync($"/api/lists/{bobList}/todos/{item.Id}", new { isCompleted = true })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await bob.DeleteAsync($"/api/lists/{bobList}/todos/{item.Id}")).StatusCode);
    }

    [Fact]
    public async Task Unauthenticated_request_is_unauthorized()
    {
        var client = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/lists")).StatusCode);
    }
}
