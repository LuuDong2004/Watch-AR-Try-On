package com.truewrist.backend.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.apache.commons.logging.Log;
import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.logging.DeferredLogFactory;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Loads a local {@code .env} file (KEY=VALUE) into the Spring {@link
 * org.springframework.core.env.Environment} so production config only needs a
 * {@code .env} next to the jar — no external library required.
 *
 * <p>Registered via {@code META-INF/spring/...EnvironmentPostProcessor.imports}
 * (the Spring Boot 4 mechanism). The previous {@code spring-dotenv} library
 * registered through {@code spring.factories}, which Boot 4 no longer loads, so
 * the file was silently ignored.</p>
 *
 * <p>Real OS environment variables and {@code -D} system properties still win:
 * the {@code .env} source is added <em>last</em>, so it only fills gaps and
 * overrides the {@code ${VAR:default}} fallbacks in application.yml.</p>
 */
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor {

    private static final String SOURCE_NAME = "dotenvFile";

    private final Log log;

    public DotenvEnvironmentPostProcessor(DeferredLogFactory logFactory) {
        this.log = logFactory.getLog(DotenvEnvironmentPostProcessor.class);
    }

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Path file = locateDotenv();
        if (file == null) {
            log.info("No .env file found; using application.yml defaults and OS environment.");
            return;
        }
        Map<String, Object> values = parse(file);
        if (values.isEmpty()) {
            return;
        }
        // addLast → OS env / system properties take precedence over .env.
        environment.getPropertySources().addLast(new MapPropertySource(SOURCE_NAME, values));
        log.info("Loaded " + values.size() + " entries from " + file.toAbsolutePath());
    }

    /** Search a few sensible locations relative to the working directory. */
    private Path locateDotenv() {
        String override = System.getProperty("DOTENV_PATH", System.getenv("DOTENV_PATH"));
        List<Path> candidates = new java.util.ArrayList<>();
        if (override != null && !override.isBlank()) {
            candidates.add(Paths.get(override));
        }
        Path cwd = Paths.get(System.getProperty("user.dir"));
        candidates.add(cwd.resolve(".env"));
        // Nested module layout: IDE run configs often use the outer `backend/`
        // folder as the working directory while the .env lives in the inner
        // `backend/backend/` module — so `backend/.env` resolves the gap.
        candidates.add(cwd.resolve("backend").resolve(".env"));
        // Repo-root working directory (e.g. some IDE run configs).
        candidates.add(cwd.resolve("backend").resolve("backend").resolve(".env"));
        candidates.add(cwd.getParent() == null ? cwd.resolve(".env") : cwd.getParent().resolve(".env"));
        for (Path c : candidates) {
            if (c != null && Files.isRegularFile(c)) {
                return c;
            }
        }
        return null;
    }

    /** Parse KEY=VALUE lines: skips blanks/comments, strips `export` and surrounding quotes. */
    private Map<String, Object> parse(Path file) {
        Map<String, Object> map = new LinkedHashMap<>();
        try {
            for (String raw : Files.readAllLines(file, StandardCharsets.UTF_8)) {
                String line = raw.trim();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }
                if (line.startsWith("export ")) {
                    line = line.substring("export ".length()).trim();
                }
                int eq = line.indexOf('=');
                if (eq <= 0) {
                    continue;
                }
                String key = line.substring(0, eq).trim();
                String value = line.substring(eq + 1).trim();
                if ((value.startsWith("\"") && value.endsWith("\"") && value.length() >= 2)
                        || (value.startsWith("'") && value.endsWith("'") && value.length() >= 2)) {
                    value = value.substring(1, value.length() - 1);
                }
                if (!key.isEmpty()) {
                    map.put(key, value);
                }
            }
        } catch (IOException e) {
            log.warn("Failed to read .env at " + file + ": " + e.getMessage());
        }
        return map;
    }
}
