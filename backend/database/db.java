package backend.database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class db {

    private static final String URL = "jdbc:mysql://localhost:3306/beirutifade";
    private static final String USER = "root"; 
    private static final String PASSWORD = "root";

    public static Connection getConnection() throws SQLException {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            return DriverManager.getConnection(URL, USER, PASSWORD);
        } catch (ClassNotFoundException e) {
            throw new SQLException("MySQL Driver not found! Did you add the JAR file?", e);
        }
    }
}