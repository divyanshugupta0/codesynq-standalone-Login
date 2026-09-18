exports.handler = async function(event, context) {
    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            apiKey: process.env.FIREBASE_API_KEY,
            // Login is hosted on Netlify; authDomain must match this host (see __/firebase/init.json + netlify.toml).
            authDomain: "codesynqlogin.netlify.app",
            databaseURL: process.env.FIREBASE_DATABASE_URL,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID,
            measurementId: process.env.FIREBASE_MEASUREMENT_ID
        })
    };
};
