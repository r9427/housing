import java.net.HttpURLConnection;
import java.net.URI;

public class HealthCheck {
    public static void main(String[] args) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) URI.create("http://127.0.0.1:8080/api/health").toURL().openConnection();
        connection.setConnectTimeout(3000);
        connection.setReadTimeout(3000);
        int status = connection.getResponseCode();
        connection.disconnect();
        if (status != 200) {
            System.exit(1);
        }
    }
}
