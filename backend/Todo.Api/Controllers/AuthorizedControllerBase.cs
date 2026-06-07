using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace Todo.Api.Controllers;

// Base for controllers behind [Authorize]: exposes the authenticated user's id, read from the
// validated JWT's NameIdentifier claim.
public abstract class AuthorizedControllerBase : ControllerBase
{
    protected Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
