using System.Net;

namespace Todo.Api.Tests;

public class SecurityHeaderTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    [Theory]
    [InlineData("X-Content-Type-Options", "nosniff")]
    [InlineData("X-Frame-Options", "DENY")]
    [InlineData("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none'")]
    public async Task Security_headers_are_present_on_api_responses(string header, string expectedValue)
    {
        var client = factory.CreateClient();
        var res = await client.GetAsync("/api/health");

        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        Assert.True(res.Headers.TryGetValues(header, out var values), $"Missing header: {header}");
        Assert.Equal(expectedValue, values!.Single());
    }
}
