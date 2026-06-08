using System.Net;
using System.Net.Http.Json;

namespace Todo.Api.Tests;

public class TodoCrudTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    private async Task<(HttpClient client, Guid listId)> SetupAsync()
    {
        var client = factory.CreateClient();
        client.Authorize((await client.RegisterAsync()).Token);
        return (client, await client.DefaultListIdAsync());
    }

    private static async Task<ItemResp> CreateAsync(HttpClient client, Guid listId, string title)
    {
        var res = await client.PostAsJsonAsync($"/api/lists/{listId}/todos", new { title });
        res.EnsureSuccessStatusCode();
        return (await res.Content.ReadFromJsonAsync<ItemResp>())!;
    }

    [Fact]
    public async Task Create_appends_positions_and_get_is_ordered()
    {
        var (client, listId) = await SetupAsync();
        var a = await CreateAsync(client, listId, "a");
        var b = await CreateAsync(client, listId, "b");

        Assert.Equal(0, a.Position);
        Assert.Equal(1, b.Position);

        var items = await client.GetFromJsonAsync<List<ItemResp>>($"/api/lists/{listId}/todos");
        Assert.Collection(items!,
            x => Assert.Equal("a", x.Title),
            x => Assert.Equal("b", x.Title));
    }

    [Fact]
    public async Task Update_edits_title_and_toggles_completion()
    {
        var (client, listId) = await SetupAsync();
        var item = await CreateAsync(client, listId, "first");

        var res = await client.PutAsJsonAsync($"/api/lists/{listId}/todos/{item.Id}",
            new { title = "renamed", isCompleted = true });
        res.EnsureSuccessStatusCode();

        var updated = (await res.Content.ReadFromJsonAsync<ItemResp>())!;
        Assert.Equal("renamed", updated.Title);
        Assert.True(updated.IsCompleted);
        Assert.True(updated.UpdatedAt >= item.UpdatedAt);
    }

    [Fact]
    public async Task Delete_removes_item()
    {
        var (client, listId) = await SetupAsync();
        var item = await CreateAsync(client, listId, "del");

        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/lists/{listId}/todos/{item.Id}")).StatusCode);
        // Gone now → deleting again is a 404.
        Assert.Equal(HttpStatusCode.NotFound, (await client.DeleteAsync($"/api/lists/{listId}/todos/{item.Id}")).StatusCode);
    }
}
