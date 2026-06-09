namespace Todo.Api.Auth;

// Bound from the "Jwt" config section. Issuer/Audience/ExpiryMinutes in appsettings; the
// signing Key comes from env/secret manager and must never be committed
public class JwtOptions
{
    public string Key { get; set; } = "";
    public string Issuer { get; set; } = "";
    public string Audience { get; set; } = "";
    public int ExpiryMinutes { get; set; } = 60;
}
