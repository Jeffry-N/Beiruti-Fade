package backend.handlers;

import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import backend.database.db;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.net.URLDecoder;
import java.sql.*;

public class ProfileHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");

        if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        if (exchange.getRequestMethod().equalsIgnoreCase("GET")) {
            String query = exchange.getRequestURI().getQuery();
            String idStr = getQueryValue(query, "id");
            String type = getQueryValue(query, "type");

            if (idStr.isEmpty() || type.isEmpty()) {
                sendResponse(exchange, 400, "{\"error\": \"Missing id or type\"}");
                return;
            }

            int id = Integer.parseInt(idStr);
            try (Connection conn = db.getConnection()) {
                String sql = "SELECT Id, FullName, Email, Username" + (type.equals("barber") ? ", Bio, ImageUrl" : "") + " FROM " + type + " WHERE Id = ?";
                PreparedStatement pstmt = conn.prepareStatement(sql);
                pstmt.setInt(1, id);

                ResultSet rs = pstmt.executeQuery();
                if (rs.next()) {
                    StringBuilder response = new StringBuilder();
                    response.append("{");
                    response.append(String.format("\"id\": %d, \"name\": \"%s\", \"email\": \"%s\", \"username\": \"%s\", \"type\": \"%s\"",
                        rs.getInt("Id"), rs.getString("FullName"), rs.getString("Email"), rs.getString("Username"), type));
                    if (type.equals("barber")) {
                        String bio = rs.getString("Bio");
                        String imageUrl = rs.getString("ImageUrl");
                        response.append(String.format(", \"bio\": \"%s\"", bio != null ? bio : ""));
                        response.append(String.format(", \"profileImage\": \"%s\"", imageUrl != null ? imageUrl : ""));
                    }
                    response.append("}");
                    sendResponse(exchange, 200, response.toString());
                } else {
                    sendResponse(exchange, 404, "{\"error\": \"User not found\"}");
                }
            } catch (Exception e) {
                sendResponse(exchange, 500, "{\"error\": \"Server error\"}");
            }
            return;
        }

        if (exchange.getRequestMethod().equalsIgnoreCase("PUT")) {
            InputStream is = exchange.getRequestBody();
            String body = new String(is.readAllBytes(), StandardCharsets.UTF_8);

            String idStr = getValue(body, "id");
            String type = getValue(body, "type"); // 'customer' or 'barber'
            String fullName = getValue(body, "fullName");
            String email = getValue(body, "email");
            String password = getValue(body, "password");
            String bio = getValue(body, "bio"); // barber only
            String profileImage = getValue(body, "profileImage"); // barber only

            if (idStr.isEmpty() || type.isEmpty()) {
                sendResponse(exchange, 400, "{\"error\": \"Missing id or type\"}");
                return;
            }

            int id = Integer.parseInt(idStr);

            try (Connection conn = db.getConnection()) {
                StringBuilder sql = new StringBuilder("UPDATE " + type + " SET ");
                boolean first = true;
                if (!fullName.isEmpty()) { sql.append("FullName = ?"); first = false; }
                if (!email.isEmpty()) { sql.append(first ? "Email = ?" : ", Email = ?"); first = false; }
                if (!password.isEmpty() && !password.equals("undefined")) { sql.append(first ? "Password = ?" : ", Password = ?"); first = false; }
                if (type.equals("barber") && !bio.isEmpty()) { sql.append(first ? "Bio = ?" : ", Bio = ?"); first = false; }
                if (type.equals("barber") && !profileImage.isEmpty()) { sql.append(first ? "ImageUrl = ?" : ", ImageUrl = ?"); }
                sql.append(" WHERE Id = ?");

                // If nothing to update
                if (sql.toString().contains("SET  WHERE")) {
                    sendResponse(exchange, 400, "{\"error\": \"No fields provided\"}");
                    return;
                }

                PreparedStatement pstmt = conn.prepareStatement(sql.toString());
                int idx = 1;
                if (!fullName.isEmpty()) { pstmt.setString(idx++, fullName); }
                if (!email.isEmpty()) { pstmt.setString(idx++, email); }
                if (!password.isEmpty() && !password.equals("undefined")) { pstmt.setString(idx++, password); }
                if (type.equals("barber") && !bio.isEmpty()) { pstmt.setString(idx++, bio); }
                if (type.equals("barber") && !profileImage.isEmpty()) { pstmt.setString(idx++, profileImage); }
                pstmt.setInt(idx, id);

                int updated = pstmt.executeUpdate();
                if (updated > 0) {
                    sendResponse(exchange, 200, "{\"message\": \"Profile updated\"}");
                } else {
                    sendResponse(exchange, 404, "{\"error\": \"User not found\"}");
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

    private String getQueryValue(String query, String key) {
        try {
            for (String part : query.split("&")) {
                String[] kv = part.split("=");
                if (kv.length == 2 && kv[0].equals(key)) {
                    return URLDecoder.decode(kv[1], StandardCharsets.UTF_8);
                }
            }
            return "";
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
