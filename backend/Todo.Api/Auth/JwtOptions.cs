namespace Todo.Api.Auth;

// Bound from the "Jwt" configuration section. Issuer/Audience/ExpiryMinutes live in
// appsettings; the signing Key comes from config/env (a secret manager in prod) and must
// never be committed.
public class JwtOptions
{
    public string Key { get; set; } = "";
    public string Issuer { get; set; } = "";
    public string Audience { get; set; } = "";
    public int ExpiryMinutes { get; set; } = 60;
}
