export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.pathname.slice(1);
    const authHeader = request.headers.get("Authorization");

    // 1. AUTH CHECK (Browser Popup)
    if (!authHeader) {
      return new Response("Auth Required", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Cloudflare R2 Upload"' },
      });
    }

    const [scheme, encoded] = authHeader.split(" ");
    const [username, password] = atob(encoded).split(":");
    if (username !== "admin" || password !== env.AUTH_KEY) {
      return new Response("Invalid credentials", { status: 403 });
    }

    // 2. SERVE UPLOAD FORM (When visiting the main page)
    if (request.method === "GET" && !key) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>R2 Quick Upload</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, system-ui, sans-serif; padding: 40px; line-height: 1.5; color: #333; }
            .card { max-width: 400px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            input[type="file"] { margin: 20px 0; display: block; }
            button { background: #0070f3; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; width: 100%; }
            button:hover { background: #0051bb; }
          </style>
        </head>
        <body>
          <div class="card">
            <h3>📤 Upload File / Archive</h3>
            <p style="font-size: 0.8rem; color: #666;">Max size: 100MB (Free Tier)</p>
            <form action="/" method="POST" enctype="multipart/form-data">
              <input type="file" name="file" required>
              <button type="submit">Upload to R2</button>
            </form>
          </div>
        </body>
        </html>
      `, { 
        headers: { "Content-Type": "text/html; charset=utf-8" } 
      });
    }

    // 3. HANDLE FORM SUBMISSION (POST)
    if (request.method === "POST") {
      try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file || typeof file === 'string') {
          return new Response("No file uploaded", { status: 400 });
        }

        await env.MY_BUCKET.put(file.name, file.stream(), {
          httpMetadata: { contentType: file.type }
        });

        return new Response(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
          </head>
          <body style="font-family:sans-serif; text-align:center; padding-top:50px;">
            <h2>✅ Success!</h2>
            <p>Uploaded: <strong>${file.name}</strong></p>
            <a href="/">Upload another</a> | <a href="/${file.name}">View File</a>
          </body>
          </html>
        `, { 
          headers: { "Content-Type": "text/html; charset=utf-8" } 
        });

      } catch (err) {
        return new Response("Upload failed: " + err.message, { status: 500 });
      }
    }

    // 4. DOWNLOAD LOGIC (GET /filename)
    if (request.method === "GET" && key) {
      const object = await env.MY_BUCKET.get(key);
      if (!object) return new Response("File Not Found", { status: 404 });

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      return new Response(object.body, { headers });
    }

    return new Response("Method not allowed", { status: 405 });
  }
};