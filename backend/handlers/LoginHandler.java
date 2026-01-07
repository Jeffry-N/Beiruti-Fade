package backend.handlers;

import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import backend.database.db;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.net.URLDecoder;
import java.sql.*;

public class LoginHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");

        if (exchange.getRequestMethod().equalsIgnoreCase("POST")) {
            InputStream is = exchange.getRequestBody();
            String body = new String(is.readAllBytes(), StandardCharsets.UTF_8);

            String username = getValue(body, "username");
            String password = getValue(body, "password");
            String type = getValue(body, "type"); // "customer" or "barber"

            try (Connection conn = db.getConnection()) {
                String sql = "SELECT * FROM " + type + " WHERE Username = ? AND Password = ?";
                PreparedStatement pstmt = conn.prepareStatement(sql);
                pstmt.setString(1, username);
                pstmt.setString(2, password);

                ResultSet rs = pstmt.executeQuery();

                if (rs.next()) {
                    // Return user info if match found
                    String imageUrl = "";
                    if (type.equals("barber")) {
                        imageUrl = rs.getString("ImageUrl");
                        if (imageUrl == null) imageUrl = "";
                    }
                    
                    String response;
                    if (type.equals("barber") && !imageUrl.isEmpty()) {
                        response = String.format(
                            "{\"id\": %d, \"name\": \"%s\", \"type\": \"%s\", \"profileImage\": \"%s\"}",
                            rs.getInt("Id"), rs.getString("FullName"), type, imageUrl
                        );
                    } else {
                        response = String.format(
                            "{\"id\": %d, \"name\": \"%s\", \"type\": \"%s\"}",
                            rs.getInt("Id"), rs.getString("FullName"), type
                        );
                    }
                    sendResponse(exchange, 200, response);
                } else {
                    sendResponse(exchange, 401, "{\"error\": \"Invalid credentials\"}");
                }
            } catch (Exception e) {
                sendResponse(exchange, 500, "{\"error\": \"Server error\"}");
            }
        } else {
            exchange.sendResponseHeaders(405, -1);
        }
    }

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