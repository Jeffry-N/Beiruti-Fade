package backend;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import backend.handlers.SignupHandler;
import backend.handlers.LoginHandler;
import backend.handlers.ServiceHandler;
import backend.handlers.BarberHandler;
import backend.handlers.AppointmentHandler;
import backend.handlers.ProfileHandler;

public class MainServer {
    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        
        // Contexts (Routes)
        server.createContext("/signup", new SignupHandler());
        server.createContext("/login", new LoginHandler());
        server.createContext("/services", new ServiceHandler());
        server.createContext("/barbers", new BarberHandler());
        server.createContext("/appointment", new AppointmentHandler());
        server.createContext("/profile", new ProfileHandler());
        
        server.setExecutor(null);
        System.out.println("Backend running on port 8080...");
        server.start();
    }
}