using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using appointza;
using appointza.Authentication.Middlewares;
using appointza.integrations.Authentication.Middlewares;
using appointza.Middlewares;
using appointza.Utils;

var contentRoot = AppContext.BaseDirectory;
var wwwrootCandidate = Path.Combine(contentRoot, "wwwroot");
var hasWwwroot = Directory.Exists(wwwrootCandidate);

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = hasWwwroot ? contentRoot : Directory.GetCurrentDirectory(),
    WebRootPath = hasWwwroot ? wwwrootCandidate : "wwwroot",
});

// Server port + frontend API URL: appointza-urls.json next to the exe
var appointzaUrls = AppointzaUrls.Load();
appointzaUrls.BindKestrel(builder);

var serverApiBase = appointzaUrls.ResolveServerApiBaseUrl();
builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
{
    ["ApplicationSettings:baseUrl"] = serverApiBase,
    ["ApplicationSettings:templateBaseUrl"] = $"{serverApiBase}/template"
});
Console.WriteLine($"  apiBaseUrl (server): {serverApiBase}");

// CONFIGURATION
builder.Services.Configure<ApplicationEnvironment>(
    builder.Configuration.GetSection("ApplicationSettings"));

var appSettings = builder.Configuration
    .GetSection("ApplicationSettings")
    .Get<ApplicationEnvironment>();

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

// LOGGING
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddLog4Net("log4net.config");

// SERVICES
builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = null;
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c => c.CustomSchemaIds(type => type.FullName!.Replace("+", ".")));

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.SetIsOriginAllowed(origin => true) // This supports any origin dynamically, fixing strict-origin-when-cross-origin issues on subdomains
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

builder.Services.AddHealthChecks()
    .AddNpgSql(appSettings.postgresqlconnection, name: "postgresql")
    .AddNpgSql(appSettings.campusza_postgresqlconnection, name: "campusza-postgresql")
    .AddRedis(appSettings.redis?.connection_string ?? "localhost:6379", name: "redis");

builder.Services.AddMemoryCache();
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = appSettings.redis?.connection_string ?? "localhost:6379";
    options.InstanceName = appSettings.redis?.instance_name ?? "appointza";
});

builder.Services.AddResponseCompression();
builder.Services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
builder.Services.AddSingleton<AppState>();
builder.Services.AddScoped<RequestState>();
builder.Services.AddScoped<IDbProvider, PostgreSQLProvider>();
builder.Services.AddScoped<ICampuszaDbProvider, CampuszaDbProvider>();
builder.Services.AddCustomServices();

var app = builder.Build();

// SWAGGER / STATIC FILES
app.UseSwagger();
app.UseSwaggerUI();

// Prefer the wwwroot next to the published exe (no machine-specific paths).
var staticPathCandidates = new[]
{
    Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "wwwroot")),
    Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, "wwwroot")),
    Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot")),
};

var appointzaBuildPath = staticPathCandidates.FirstOrDefault(Directory.Exists);
var wwwrootPath = !string.IsNullOrWhiteSpace(appointzaBuildPath)
    ? appointzaBuildPath
    : Path.Combine(AppContext.BaseDirectory, "wwwroot");

if (!Directory.Exists(wwwrootPath))
{
    Directory.CreateDirectory(wwwrootPath);
}

var wwwrootProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(wwwrootPath);

// The UI fetches this before it boots; must run before static files so no wwwroot copy can shadow it.
var browserUrlsPayload = appointzaUrls.ToBrowserPayload();
app.Use(async (ctx, next) =>
{
    if (string.Equals(ctx.Request.Path.Value, AppointzaUrls.RequestPath, StringComparison.OrdinalIgnoreCase))
    {
        ctx.Response.Headers.CacheControl = "no-store";
        await ctx.Response.WriteAsJsonAsync(browserUrlsPayload);
        return;
    }
    await next();
});

app.UseDefaultFiles(new DefaultFilesOptions
{
    FileProvider = wwwrootProvider,
    RequestPath = ""
});

// Shared wwwroot (config.js, legacy root assets, SPA folders under wwwroot/{segment}/)
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = wwwrootProvider,
    RequestPath = ""
});

// Product UIs: /appointza, /campusza, /webzys
// DefaultFiles so /webzys/ (trailing slash, no file) serves that SPA's index.html
// instead of falling through to the root Appointza SPA.
foreach (var spaSegment in new[] { "appointza", "campusza", "webzys" })
{
    var spaPhysicalPath = Path.Combine(wwwrootPath, spaSegment);
    if (!Directory.Exists(spaPhysicalPath))
    {
        continue;
    }

    var spaProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(spaPhysicalPath);
    app.UseDefaultFiles(new DefaultFilesOptions
    {
        FileProvider = spaProvider,
        RequestPath = $"/{spaSegment}"
    });
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = spaProvider,
        RequestPath = $"/{spaSegment}"
    });
    Console.WriteLine($"✅ SPA static files: /{spaSegment} → {spaPhysicalPath}");
}

Console.WriteLine($"✅ wwwroot: {wwwrootPath}");

// COMMON MIDDLEWARE
app.UseResponseCompression();
app.UseCors();
app.UseRouting();

// ✅ SUBDOMAIN ORGANIZATION MIDDLEWARE - Must be early in the pipeline
app.UseSubdomainOrganization();

// ✅ MIDDLEWARE FOR /api/b2b
app.UseMiddleware<ServerToServerAuthMiddleware>();

// ✅ MIDDLEWARE FOR /api/user
app.UseMiddleware<JwtMiddleware>();

// ERROR HANDLING — before endpoints so exceptions from controllers are caught
app.UseMiddleware<ErrorHandlerMiddleware>();

// MAP CONTROLLERS
app.MapControllers();

// HEALTH
app.MapHealthChecks("/health");

var rootIndexHtml = Path.Combine(wwwrootPath, "index.html");
var multiPortRootSpa = File.Exists(rootIndexHtml);

if (multiPortRootSpa)
{
    // Multi-port deploy: Appointza UI at wwwroot root (e.g. http://localhost:5000/)
    // Must use the same FileProvider as UseStaticFiles — default WebRoot is not our build output.
    app.MapFallbackToFile(
        "index.html",
        new StaticFileOptions
        {
            FileProvider = wwwrootProvider,
            RequestPath = "",
        });
    Console.WriteLine("✅ Multi-port SPA: Appointza UI at / (wwwroot/index.html)");
}
else
{
    // Combined path deploy: /appointza, /campusza, /webzys under one host
    app.MapGet("/", () => Results.Redirect("/appointza/"));

    foreach (var spaSegment in new[] { "appointza", "campusza", "webzys" })
    {
        var indexPhysical = Path.Combine(wwwrootPath, spaSegment, "index.html");
        if (!File.Exists(indexPhysical))
            continue;

        var indexRelative = $"{spaSegment}/index.html";
        var segment = spaSegment;

        app.MapGet($"/{segment}", () => Results.Redirect($"/{segment}/"));
        app.MapGet($"/{segment}/", async (HttpContext ctx) =>
        {
            ctx.Response.ContentType = "text/html; charset=utf-8";
            await ctx.Response.SendFileAsync(indexPhysical);
        });
        app.MapFallbackToFile($"/{segment}/{{**slug}}", indexRelative);
    }

}

app.Run();
