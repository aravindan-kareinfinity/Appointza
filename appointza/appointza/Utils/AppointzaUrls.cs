using System.Net;
using System.Text.Json;

namespace appointza.Utils
{
    /// <summary>
    /// The only URL/port config: <c>appointza-urls.json</c> next to <c>appointza.exe</c>.
    /// The server binds from it and serves it to the browser at <c>/appointza-urls.json</c>.
    /// </summary>
    public class AppointzaUrls
    {
        public const string FileName = "appointza-urls.json";
        public const string RequestPath = "/" + FileName;

        public string backendListen { get; set; } = "http://0.0.0.0:5050";
        public string frontendApiBaseUrl { get; set; } = "";

        public int Port => PortFromListenUrl(backendListen);

        public static AppointzaUrls Load()
        {
            var path = ResolvePath();
            if (path != null)
            {
                try
                {
                    var parsed = JsonSerializer.Deserialize<AppointzaUrls>(
                        File.ReadAllText(path),
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (parsed != null)
                    {
                        if (string.IsNullOrWhiteSpace(parsed.backendListen))
                            parsed.backendListen = "http://0.0.0.0:5050";
                        parsed.backendListen = parsed.backendListen.Trim();
                        parsed.frontendApiBaseUrl = (parsed.frontendApiBaseUrl ?? "").Trim().TrimEnd('/');

                        Console.WriteLine($"URLs: {path}");
                        Console.WriteLine($"  backendListen:      {parsed.backendListen}");
                        Console.WriteLine(
                            $"  frontendApiBaseUrl: {(string.IsNullOrEmpty(parsed.frontendApiBaseUrl) ? "(same host as the page)" : parsed.frontendApiBaseUrl)}");
                        return parsed;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"URLs: failed to read {path}: {ex.Message}");
                }
            }

            Console.WriteLine($"URLs: {FileName} not found next to the exe - using defaults (port 5050, same-origin API)");
            return new AppointzaUrls();
        }

        /// <summary>
        /// Next to the exe first (deployed build). During development, fall back to the
        /// UI source file <c>appointza-ui-canvas/public/appointza-urls.json</c>.
        /// </summary>
        private static string? ResolvePath()
        {
            var nextToExe = Path.Combine(AppContext.BaseDirectory, FileName);
            if (File.Exists(nextToExe))
                return Path.GetFullPath(nextToExe);

            var current = new DirectoryInfo(Directory.GetCurrentDirectory());
            for (var depth = 0; current != null && depth < 6; depth++, current = current.Parent)
            {
                var source = Path.Combine(current.FullName, "appointza-ui-canvas", "public", FileName);
                if (File.Exists(source))
                    return source;
            }

            return null;
        }

        public static int PortFromListenUrl(string? listenUrl)
        {
            var text = (listenUrl ?? "").Trim().TrimEnd('/');
            var colon = text.LastIndexOf(':');
            if (colon >= 0 && int.TryParse(text[(colon + 1)..], out var port) && port > 0 && port < 65536)
                return port;
            return 5050;
        }

        public void BindKestrel(WebApplicationBuilder builder)
        {
            var port = Port;
            builder.WebHost.ConfigureKestrel(options => options.Listen(IPAddress.Any, port));
            Console.WriteLine($"Listening on port {port} - open http://localhost:{port}/");
        }

        /// <summary>
        /// Absolute API origin for server-generated links. Empty frontendApiBaseUrl means localhost:{port}.
        /// </summary>
        public string ResolveServerApiBaseUrl()
        {
            if (!string.IsNullOrWhiteSpace(frontendApiBaseUrl))
                return ToBrowserOrigin(frontendApiBaseUrl);
            return $"http://localhost:{Port}";
        }

        /// <summary>What the browser receives from <c>/appointza-urls.json</c>.</summary>
        public object ToBrowserPayload() => new
        {
            backendListen,
            frontendApiBaseUrl = string.IsNullOrWhiteSpace(frontendApiBaseUrl) ? "" : ToBrowserOrigin(frontendApiBaseUrl),
        };

        public static string ToBrowserOrigin(string url)
        {
            var value = (url ?? "").Trim().TrimEnd('/');
            if (string.IsNullOrWhiteSpace(value))
                return "";

            // 0.0.0.0 is a bind address; browsers reject it.
            try
            {
                var uri = new Uri(value);
                if (uri.Host is not ("0.0.0.0" or "::" or "[::]"))
                    return value;
                return new UriBuilder(uri) { Host = "localhost" }.Uri.ToString().TrimEnd('/');
            }
            catch
            {
                return value.Replace("://0.0.0.0", "://localhost", StringComparison.OrdinalIgnoreCase);
            }
        }
    }
}
