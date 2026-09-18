exports.handler = async function(event, context) {
    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            apiKey: process.env.FIREBASE_API_KEY,
            // Must stay on *.firebaseapp.com unless Google/GitHub OAuth redirect URIs are updated for a custom domain.
            authDomain: process.env.FIREBASE_AUTH_DOMAIN || "codenexus-cbb96.firebaseapp.com",
            databaseURL: process.env.FIREBASE_DATABASE_URL,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID,
            measurementId: process.env.FIREBASE_MEASUREMENT_ID
        })
    };
};
