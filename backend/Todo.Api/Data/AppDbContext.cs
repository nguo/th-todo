using Microsoft.EntityFrameworkCore;

namespace Todo.Api.Data;

// The gateway to the database
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
}
