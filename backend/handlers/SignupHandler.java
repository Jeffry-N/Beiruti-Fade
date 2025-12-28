package backend.handlers;

import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import backend.database.db;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.net.URLDecoder;
import java.sql.*;

public class SignupHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        // Standard CORS headers for Expo
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");

        if (exchange.getRequestMethod().equalsIgnoreCase("POST")) {
            InputStream is = exchange.getRequestBody();
            String body = new String(is.readAllBytes(), StandardCharsets.UTF_8);

            // Manual extraction for form-urlencoded body.
            // Expecting: fullName=...&username=...&email=...&password=...&type=...
            String fullName = getValue(body, "fullName");
            String username = getValue(body, "username");
            String email = getValue(body, "email");
            String password = getValue(body, "password");
            String type = getValue(body, "type"); // "customer" or "barber"

            try (Connection conn = db.getConnection()) {
                String sql = "INSERT INTO " + type + " (FullName, Username, Email, Password) VALUES (?, ?, ?, ?)";
                PreparedStatement pstmt = conn.prepareStatement(sql);
                pstmt.setString(1, fullName);
                pstmt.setString(2, username);
                pstmt.setString(3, email);
                pstmt.setString(4, password);

                pstmt.executeUpdate();
                sendResponse(exchange, 201, "{\"message\": \"Registration successful\"}");
            } catch (Exception e) {
                sendResponse(exchange, 500, "{\"error\": \"" + e.getMessage() + "\"}");
            }
        } else {
            exchange.sendResponseHeaders(405, -1);
        }
    }

    // Simple helper to parse plain text/form data
    private String getValue(String body, String key) {
        try {
            String raw = body.split(key + "=")[1].split("&")[0];
            return URLDecoder.decode(raw, StandardCharsets.UTF_8);
        } catch (Exception e) { return ""; }
    }

    private void sendResponse(HttpExchange exchange, int code, String response) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(code, response.getBytes().length);
        OutputStream os = exchange.getResponseBody();
        os.write(response.getBytes());
        os.close();
    }
}