package online.cheruvugattu.app;

import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginHandle;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;

public class MainActivity extends BridgeActivity {

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
