/**
 * Note App - Simple Note Keeping
 */


const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Note App</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f5f5f5; min-height: 100vh; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { text-align: center; color: #333; margin-bottom: 30px; }
    .add-note { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; }
    .add-note textarea { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; resize: vertical; min-height: 80px; font-size: 16px; }
    .add-note button { margin-top: 10px; padding: 10px 24px; background: #4f46e5; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; }
    .notes { display: grid; gap: 16px; }
    .note { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); position: relative; }
    .note-content { white-space: pre-wrap; }
    .note-date { font-size: 12px; color: #888; margin-top: 10px; }
    .note-actions { position: absolute; top: 10px; right: 10px; }
    .note-actions button { padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer; background: #fee2e2; color: #dc2626; }
    .empty { text-align: center; color: #888; padding: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>My Notes</h1>
    <div class="add-note">
      <textarea id="noteInput" placeholder="Write your note..."></textarea>
      <button onclick="addNote()">Add Note</button>
    </div>
    <div class="notes" id="notesList"></div>
  </div>
  <script>
    const API = '/api/notes';
    
    function escapeHtml(text) {
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    
    async function loadNotes() {
      const res = await fetch(API);
      const data = await res.json();
      const list = document.getElementById('notesList');
      if (!data.notes || data.notes.length === 0) {
        list.innerHTML = '<div class="empty">No notes yet!</div>';
        return;
      }
      let html = '';
      for (var i = 0; i < data.notes.length; i++) {
        var n = data.notes[i];
        html += '<div class="note"><div class="note-actions"><button onclick="deleteNote(' + n.id + ')">Delete</button></div><div class="note-content">' + escapeHtml(n.content) + '</div><div class="note-date">' + new Date(n.created_at).toLocaleString() + '</div></div>';
      }
      list.innerHTML = html;
    }
    
    async function addNote() {
      var content = document.getElementById('noteInput').value.trim();
      if (!content) return;
      await fetch(API, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({content: content}) });
      document.getElementById('noteInput').value = '';
      loadNotes();
    }
    
    async function deleteNote(id) {
      if (confirm('Delete?')) {
        await fetch(API + '/' + id, { method: 'DELETE' });
        loadNotes();
      }
    }
    
    loadNotes();
  </script>
</body>
</html>`;

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,DELETE',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    
    // GET /api/notes
    if (path === '/api/notes' && request.method === 'GET') {
      try {
        const notes = await env.DB.prepare('SELECT * FROM notes ORDER BY created_at DESC LIMIT 100').all();
        return new Response(JSON.stringify({ notes: notes.results }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }
    
    // POST /api/notes
    if (path === '/api/notes' && request.method === 'POST') {
      try {
        const { content } = await request.json();
        if (!content || !content.trim()) {
          return new Response(JSON.stringify({ error: 'Content required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        await env.DB.prepare('INSERT INTO notes (content) VALUES (?)').bind(content.trim()).run();
        return new Response(JSON.stringify({ success: true }), { status: 201, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }
    
    // DELETE /api/notes/:id
    if (path.startsWith('/api/notes/') && request.method === 'DELETE') {
      try {
        const id = parseInt(path.split('/')[3]);
        await env.DB.prepare('DELETE FROM notes WHERE id = ?').bind(id).run();
        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }
    
    // Serve HTML
    return new Response(HTML, { headers: { 'Content-Type': 'text/html' } });
  }
};