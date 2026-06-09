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

    [Theory]
    [InlineData("")] // empty → [Required]
    [InlineData("   ")] // whitespace-only → controller guard
    public async Task Create_rejects_empty_or_blank_title(string title)
    {
        var (client, listId) = await SetupAsync();
        var res = await client.PostAsJsonAsync($"/api/lists/{listId}/todos", new { title });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Create_rejects_too_long_title()
    {
        var (client, listId) = await SetupAsync();
        var res = await client.PostAsJsonAsync($"/api/lists/{listId}/todos", new { title = new string('a', 501) });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Create_trims_surrounding_whitespace()
    {
        var (client, listId) = await SetupAsync();
        var item = await CreateAsync(client, listId, "  buy milk  ");
        Assert.Equal("buy milk", item.Title);
    }

    [Fact]
    public async Task Update_changes_only_the_fields_provided()
    {
        var (client, listId) = await SetupAsync();
        var item = await CreateAsync(client, listId, "x");

        // Send only isCompleted → title stays "x".
        var toggled = (await (await client.PutAsJsonAsync(
            $"/api/lists/{listId}/todos/{item.Id}", new { isCompleted = true })).Content.ReadFromJsonAsync<ItemResp>())!;
        Assert.Equal("x", toggled.Title);
        Assert.True(toggled.IsCompleted);

        // Send only title → completion stays true.
        var renamed = (await (await client.PutAsJsonAsync(
            $"/api/lists/{listId}/todos/{item.Id}", new { title = "y" })).Content.ReadFromJsonAsync<ItemResp>())!;
        Assert.Equal("y", renamed.Title);
        Assert.True(renamed.IsCompleted);
    }

    [Fact]
    public async Task Update_blank_title_is_bad_request()
    {
        var (client, listId) = await SetupAsync();
        var item = await CreateAsync(client, listId, "x");
        var res = await client.PutAsJsonAsync($"/api/lists/{listId}/todos/{item.Id}", new { title = "   " });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Update_nonexistent_item_in_own_list_is_not_found()
    {
        var (client, listId) = await SetupAsync();
        var res = await client.PutAsJsonAsync($"/api/lists/{listId}/todos/{Guid.NewGuid()}", new { title = "z" });
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }

    [Fact]
    public async Task Create_allows_duplicate_titles()
    {
        // Titles aren't unique — the same text creates two distinct items (POST always creates).
        var (client, listId) = await SetupAsync();
        var first = await CreateAsync(client, listId, "buy milk");
        var second = await CreateAsync(client, listId, "buy milk");

        Assert.NotEqual(first.Id, second.Id);
        var items = await client.GetFromJsonAsync<List<ItemResp>>($"/api/lists/{listId}/todos");
        Assert.Equal(2, items!.Count(i => i.Title == "buy milk"));
    }
}
