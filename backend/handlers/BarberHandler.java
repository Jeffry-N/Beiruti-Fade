package backend.handlers;

import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import backend.database.db;
import java.io.*;
import java.sql.*;

public class BarberHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");

        if (exchange.getRequestMethod().equalsIgnoreCase("GET")) {
            try (Connection conn = db.getConnection()) {
                String query = exchange.getRequestURI().getQuery();
                Integer id = null;
                if (query != null) {
                    for (String part : query.split("&")) {
                        String[] kv = part.split("=");
                        if (kv.length == 2 && kv[0].equals("id")) {
                            id = Integer.parseInt(kv[1]);
                        }
                    }
                }

                if (id != null) {
                    String sql = "SELECT Id, FullName, Bio, Email, ImageUrl FROM barber WHERE Id = ?";
                    PreparedStatement pstmt = conn.prepareStatement(sql);
                    pstmt.setInt(1, id);
                    ResultSet rs = pstmt.executeQuery();
                    if (rs.next()) {
                        String imageUrl = rs.getString("ImageUrl");
                        String imageUrlJson = (imageUrl != null && !imageUrl.isEmpty()) 
                            ? String.format(", \"imageUrl\": \"%s\"", imageUrl)
                            : "";
                        String response = String.format(
                            "{\"id\": %d, \"name\": \"%s\", \"bio\": \"%s\", \"email\": \"%s\"%s}",
                            rs.getInt("Id"), rs.getString("FullName"), rs.getString("Bio") != null ? rs.getString("Bio") : "", rs.getString("Email") != null ? rs.getString("Email") : "", imageUrlJson
                        );
                        sendResponse(exchange, 200, response);
                    } else {
                        sendResponse(exchange, 404, "{\"error\": \"Barber not found\"}");
                    }
                } else {
                    String sql = "SELECT Id, FullName, Bio, ImageUrl FROM barber";
                    PreparedStatement pstmt = conn.prepareStatement(sql);
                    ResultSet rs = pstmt.executeQuery();

                    StringBuilder jsonArray = new StringBuilder("[");
                    boolean first = true;

                    while (rs.next()) {
                        if (!first) jsonArray.append(",");
                        String imageUrl = rs.getString("ImageUrl");
                        String imageUrlJson = (imageUrl != null && !imageUrl.isEmpty()) 
                            ? String.format(", \"imageUrl\": \"%s\"", imageUrl)
                            : "";
                        jsonArray.append(String.format(
                            "{\"id\": %d, \"name\": \"%s\", \"bio\": \"%s\"%s}",
                            rs.getInt("Id"),
                            rs.getString("FullName"),
                            rs.getString("Bio") != null ? rs.getString("Bio") : "",
                            imageUrlJson
                        ));
                        first = false;
                    }
                    jsonArray.append("]");

                    sendResponse(exchange, 200, jsonArray.toString());
                }
            } catch (Exception e) {
                sendResponse(exchange, 500, "{\"error\": \"Server error\"}");
            }
        } else {
            exchange.sendResponseHeaders(405, -1);
        }
    }

    private void sendResponse(HttpExchange exchange, int code, String response) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(code, response.getBytes().length);
        OutputStream os = exchange.getResponseBody();
        os.write(response.getBytes());
        os.close();
    }
}
