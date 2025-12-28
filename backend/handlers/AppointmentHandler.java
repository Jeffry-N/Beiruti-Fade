package backend.handlers;

import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import backend.database.db;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.net.URLDecoder;
import java.sql.*;

public class AppointmentHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");

        if (exchange.getRequestMethod().equalsIgnoreCase("POST")) {
            InputStream is = exchange.getRequestBody();
            String body = new String(is.readAllBytes(), StandardCharsets.UTF_8);

            int customerId = Integer.parseInt(getValue(body, "customerId"));
            int barberId = Integer.parseInt(getValue(body, "barberId"));
            int serviceId = Integer.parseInt(getValue(body, "serviceId"));
            String appointmentDate = getValue(body, "appointmentDate");
            String appointmentTime = getValue(body, "appointmentTime");

            try (Connection conn = db.getConnection()) {
                String sql = "INSERT INTO appointment (CustomerId, BarberId, ServiceId, AppointmentDate, AppointmentTime, Status) VALUES (?, ?, ?, ?, ?, 'pending')";
                PreparedStatement pstmt = conn.prepareStatement(sql, PreparedStatement.RETURN_GENERATED_KEYS);
                pstmt.setInt(1, customerId);
                pstmt.setInt(2, barberId);
                pstmt.setInt(3, serviceId);
                pstmt.setString(4, appointmentDate);
                pstmt.setString(5, appointmentTime);

                pstmt.executeUpdate();
                ResultSet rs = pstmt.getGeneratedKeys();
                
                if (rs.next()) {
                    int appointmentId = rs.getInt(1);
                    String response = String.format("{\"success\": true, \"appointmentId\": %d}", appointmentId);
                    sendResponse(exchange, 200, response);
                } else {
                    sendResponse(exchange, 500, "{\"error\": \"Failed to create appointment\"}");
                }
            } catch (Exception e) {
                sendResponse(exchange, 500, "{\"error\": \"Server error: " + e.getMessage() + "\"}");
            }
        } else if (exchange.getRequestMethod().equalsIgnoreCase("GET")) {
            // Get appointments for a customer or barber
            String query = exchange.getRequestURI().getQuery();
            int customerId = 0;
            int barberId = 0;
            
            if (query != null && query.contains("customerId=")) {
                customerId = Integer.parseInt(query.split("customerId=")[1].split("&")[0]);
            }
            if (query != null && query.contains("barberId=")) {
                barberId = Integer.parseInt(query.split("barberId=")[1].split("&")[0]);
            }

            try (Connection conn = db.getConnection()) {
                String sql;
                PreparedStatement pstmt;
                
                if (barberId > 0) {
                    // Get appointments for a barber
                    sql = "SELECT a.Id, a.CustomerId, c.FullName as CustomerName, b.FullName as BarberName, s.Name as ServiceName, a.AppointmentDate, a.AppointmentTime, a.Status FROM appointment a JOIN barber b ON a.BarberId = b.Id JOIN customer c ON a.CustomerId = c.Id JOIN service s ON a.ServiceId = s.Id WHERE a.BarberId = ? ORDER BY a.AppointmentDate DESC";
                    pstmt = conn.prepareStatement(sql);
                    pstmt.setInt(1, barberId);
                } else {
                    // Get appointments for a customer
                    sql = "SELECT a.Id, a.CustomerId, b.FullName as BarberName, s.Name as ServiceName, a.AppointmentDate, a.AppointmentTime, a.Status FROM appointment a JOIN barber b ON a.BarberId = b.Id JOIN service s ON a.ServiceId = s.Id WHERE a.CustomerId = ? ORDER BY a.AppointmentDate DESC";
                    pstmt = conn.prepareStatement(sql);
                    pstmt.setInt(1, customerId);
                }
                
                ResultSet rs = pstmt.executeQuery();

                StringBuilder jsonArray = new StringBuilder("[");
                boolean first = true;

                while (rs.next()) {
                    if (!first) jsonArray.append(",");
                    jsonArray.append(String.format(
                        "{\"id\": %d, \"barberId\": %d, \"barberName\": \"%s\", \"serviceName\": \"%s\", \"date\": \"%s\", \"time\": \"%s\", \"status\": \"%s\"}",
                        rs.getInt("Id"),
                        rs.getInt("CustomerId"),
                        rs.getString("BarberName"),
                        rs.getString("ServiceName"),
                        rs.getString("AppointmentDate"),
                        rs.getString("AppointmentTime"),
                        rs.getString("Status")
                    ));
                    first = false;
                }
                jsonArray.append("]");

                sendResponse(exchange, 200, jsonArray.toString());
            } catch (Exception e) {
                sendResponse(exchange, 500, "{\"error\": \"Server error\"}");
            }
        } else if (exchange.getRequestMethod().equalsIgnoreCase("PUT")) {
            // Handle reschedule and status update
            String path = exchange.getRequestURI().getPath();
            InputStream is = exchange.getRequestBody();
            String body = new String(is.readAllBytes(), StandardCharsets.UTF_8);

            if (path.contains("/reschedule")) {
                // Reschedule appointment - update date and time
                int appointmentId = Integer.parseInt(getValue(body, "appointmentId"));
                String appointmentDate = getValue(body, "appointmentDate");
                String appointmentTime = getValue(body, "appointmentTime");

                try (Connection conn = db.getConnection()) {
                    String sql = "UPDATE appointment SET AppointmentDate = ?, AppointmentTime = ? WHERE Id = ?";
                    PreparedStatement pstmt = conn.prepareStatement(sql);
                    pstmt.setString(1, appointmentDate);
                    pstmt.setString(2, appointmentTime);
                    pstmt.setInt(3, appointmentId);

                    int rowsUpdated = pstmt.executeUpdate();
                    
                    if (rowsUpdated > 0) {
                        String response = "{\"success\": true, \"message\": \"Appointment rescheduled successfully\"}";
                        sendResponse(exchange, 200, response);
                    } else {
                        sendResponse(exchange, 404, "{\"error\": \"Appointment not found\"}");
                    }
                } catch (Exception e) {
                    sendResponse(exchange, 500, "{\"error\": \"Server error: " + e.getMessage() + "\"}");
                }
            } else {
                // Update appointment status
                int appointmentId = Integer.parseInt(getValue(body, "appointmentId"));
                String status = getValue(body, "status");

                try (Connection conn = db.getConnection()) {
                    String sql = "UPDATE appointment SET Status = ? WHERE Id = ?";
                    PreparedStatement pstmt = conn.prepareStatement(sql);
                    pstmt.setString(1, status);
                    pstmt.setInt(2, appointmentId);

                    int rowsUpdated = pstmt.executeUpdate();
                    
                    if (rowsUpdated > 0) {
                        String response = String.format("{\"success\": true, \"message\": \"Appointment status updated to %s\"}", status);
                        sendResponse(exchange, 200, response);
                    } else {
                        sendResponse(exchange, 404, "{\"error\": \"Appointment not found\"}");
                    }
                } catch (Exception e) {
                    sendResponse(exchange, 500, "{\"error\": \"Server error: " + e.getMessage() + "\"}");
                }
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
