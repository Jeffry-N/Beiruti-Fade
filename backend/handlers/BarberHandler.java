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
                String sql = "SELECT Id, FullName, Bio FROM barber";
                PreparedStatement pstmt = conn.prepareStatement(sql);
                ResultSet rs = pstmt.executeQuery();

                StringBuilder jsonArray = new StringBuilder("[");
                boolean first = true;

                while (rs.next()) {
                    if (!first) jsonArray.append(",");
                    jsonArray.append(String.format(
                        "{\"id\": %d, \"name\": \"%s\", \"bio\": \"%s\"}",
                        rs.getInt("Id"),
                        rs.getString("FullName"),
                        rs.getString("Bio") != null ? rs.getString("Bio") : ""
                    ));
                    first = false;
                }
                jsonArray.append("]");

                sendResponse(exchange, 200, jsonArray.toString());
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
