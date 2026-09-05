package online.cheruvugattu.app;

import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginHandle;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;

public class MainActivity extends BridgeActivity {

    // Apps targeting Android 15+ (API 35/36, which this one does - see
    // variables.gradle) can no longer opt out of edge-to-edge: the
    // @capacitor/status-bar plugin's overlaysWebView setting is silently
    // ignored by the OS at this API level (confirmed in its own source,
    // StatusBar.java's shouldSetStatusBarColor), which is why the nav bar
    // was rendering underneath the status bar/notification icons. The only
    // supported fix left is to pad the WebView by the system bars' own
    // inset size ourselves.
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().getDecorView().setBackgroundColor(Color.parseColor("#621B00"));
        ViewCompat.setOnApplyWindowInsetsListener(getBridge().getWebView(), (view, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            view.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });
    }

    // Apple has no native Android SDK, so @capgo/capacitor-social-login drives
    // Apple's own OAuth page and our backend (see /api/auth/apple/callback in
    // backend/app/main.py) exchanges the resulting code for tokens, then
    // redirects here via this app's custom URL scheme (registered in
    // AndroidManifest.xml) carrying the identity token as a query param.
    // Capacitor's own onNewIntent forwarding doesn't route this to the plugin,
    // so it has to be picked up here and handed off explicitly.
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);

        Uri data = intent.getData();
        // "success" (true or false) is present on every redirect this app's own
        // /api/auth/apple/callback issues - checking for it (not just id_token)
        // means a failed/cancelled sign-in still resolves the pending JS promise
        // instead of leaving it hanging.
        if (Intent.ACTION_VIEW.equals(intent.getAction()) && data != null && data.getQueryParameter("success") != null) {
            PluginHandle pluginHandle = getBridge().getPlugin("SocialLogin");
            if (pluginHandle == null) {
                return;
            }
            Plugin plugin = pluginHandle.getInstance();
            if (plugin instanceof SocialLoginPlugin) {
                ((SocialLoginPlugin) plugin).handleAppleLoginIntent(intent);
            }
        }
    }
}
