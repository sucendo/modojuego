package com.sonusarca.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.os.Message;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

public class MainActivity extends Activity {
    private static final String APP_URL = "https://sucendo.github.io/modojuego/sonusarca/";
    private static final String APP_HOST = "sucendo.github.io";
    private static final String APP_PATH = "/modojuego/sonusarca";

    private FrameLayout root;
    private WebView webView;
    private AppChromeClient chromeClient;
    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        root = new FrameLayout(this);
        webView = new WebView(this);
        root.addView(webView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowContentAccess(true);
        s.setAllowFileAccess(true);
        s.setSupportMultipleWindows(true);
        s.setJavaScriptCanOpenWindowsAutomatically(true);

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");
        webView.setWebViewClient(new AppWebViewClient());
        chromeClient = new AppChromeClient();
        webView.setWebChromeClient(chromeClient);
        webView.setKeepScreenOn(false);
        webView.loadUrl(APP_URL);
    }

    private boolean isAppUrl(Uri uri) {
        if (uri == null) return false;
        String host = uri.getHost();
        String path = uri.getPath();
        return "https".equalsIgnoreCase(uri.getScheme())
                && APP_HOST.equalsIgnoreCase(host)
                && path != null
                && path.startsWith(APP_PATH);
    }

    private void openExternal(Uri uri) {
        try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
        catch (Exception ignored) { }
    }

    private class AppWebViewClient extends WebViewClient {
        @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            if (!request.isForMainFrame()) return false;
            Uri uri = request.getUrl();
            if (isAppUrl(uri)) return false;
            openExternal(uri);
            return true;
        }

        @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request.isForMainFrame()) view.loadUrl("file:///android_asset/offline.html");
        }

        @Override public void onPageStarted(WebView view, String url, Bitmap favicon) {
            super.onPageStarted(view, url, favicon);
        }
    }

    private class AppChromeClient extends WebChromeClient {
        @Override public void onShowCustomView(View view, CustomViewCallback callback) {
            if (customView != null) {
                callback.onCustomViewHidden();
                return;
            }
            customView = view;
            customViewCallback = callback;
            webView.setVisibility(View.GONE);
            root.addView(customView, new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT));
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        }

        @Override public void onHideCustomView() {
            if (customView == null) return;
            root.removeView(customView);
            customView = null;
            webView.setVisibility(View.VISIBLE);
            getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
            if (customViewCallback != null) customViewCallback.onCustomViewHidden();
            customViewCallback = null;
        }

        @Override public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
            WebView popup = new WebView(MainActivity.this);
            popup.setWebViewClient(new WebViewClient() {
                @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest request) {
                    openExternal(request.getUrl());
                    v.destroy();
                    return true;
                }
            });
            WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
            transport.setWebView(popup);
            resultMsg.sendToTarget();
            return true;
        }
    }

    public class AndroidBridge {
        @JavascriptInterface public void setKeepScreenOn(final boolean enabled) {
            runOnUiThread(() -> {
                webView.setKeepScreenOn(enabled);
                if (enabled) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            });
        }
    }

    @Override public void onBackPressed() {
        if (customView != null) {
            if (chromeClient != null) chromeClient.onHideCustomView();
        } else if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override protected void onDestroy() {
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (webView != null) {
            webView.removeJavascriptInterface("AndroidBridge");
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
