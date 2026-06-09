using System.Diagnostics;
using System.Security.Claims;
using Microsoft.AspNetCore.HttpLogging;

namespace Todo.Api.Logging;

// Defense-in-depth: even if request/response body logging is enabled globally, never let
// /api/auth/* bodies (passwords on the way in, tokens on the way out) reach the logs.
// Also enriches each entry with user + trace correlators.
public sealed class AuthBodyLoggingInterceptor : IHttpLoggingInterceptor
{
    public ValueTask OnRequestAsync(HttpLoggingInterceptorContext ctx)
    {
        if (ctx.HttpContext.Request.Path.StartsWithSegments("/api/auth"))
            ctx.LoggingFields &= ~(HttpLoggingFields.RequestBody | HttpLoggingFields.ResponseBody);
        return ValueTask.CompletedTask;
    }

    // Runs after auth + the endpoint, so HttpContext.User and the request Activity are populated.
    public ValueTask OnResponseAsync(HttpLoggingInterceptorContext ctx)
    {
        var uid = ctx.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (uid is not null) ctx.AddParameter("user", uid);

        var traceId = Activity.Current?.TraceId.ToString() ?? ctx.HttpContext.TraceIdentifier;
        ctx.AddParameter("traceId", traceId);
        return ValueTask.CompletedTask;
    }
}
