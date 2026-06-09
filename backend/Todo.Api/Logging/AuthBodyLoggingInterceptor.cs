using System.Diagnostics;
using System.Security.Claims;
using Microsoft.AspNetCore.HttpLogging;

namespace Todo.Api.Logging;

// Defense-in-depth: keep /api/auth/* bodies (passwords in, tokens out) out of logs even if
// body logging is on globally. Also adds user + trace correlators
public sealed class AuthBodyLoggingInterceptor : IHttpLoggingInterceptor
{
    public ValueTask OnRequestAsync(HttpLoggingInterceptorContext ctx)
    {
        if (ctx.HttpContext.Request.Path.StartsWithSegments("/api/auth"))
            ctx.LoggingFields &= ~(HttpLoggingFields.RequestBody | HttpLoggingFields.ResponseBody);
        return ValueTask.CompletedTask;
    }

    // Runs after auth + endpoint, so HttpContext.User and the request Activity are populated
    public ValueTask OnResponseAsync(HttpLoggingInterceptorContext ctx)
    {
        var uid = ctx.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (uid is not null) ctx.AddParameter("user", uid);

        var traceId = Activity.Current?.TraceId.ToString() ?? ctx.HttpContext.TraceIdentifier;
        ctx.AddParameter("traceId", traceId);
        return ValueTask.CompletedTask;
    }
}
