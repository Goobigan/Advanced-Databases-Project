const db = new PouchDB('netflix_titles');

async function showTitles() {
    const container = document.getElementById('titles');
    container.innerHTML = '';

    const result = await db.allDocs({ include_docs: true, descending: true, limit: 6 });
    result.rows.forEach(row => {
        const title = row.doc;
        if (title._id.startsWith('_design/')) return;
        const div = document.createElement('div');
        div.className = 'title';
        div.id = `title-${title._id}`; 
        div.innerHTML = `
      <strong>${title.title}</strong> (${title.release_year})<br>
      Type: ${title.type} | Director: ${title.director} | Country: ${title.country} | Rating: ${title.rating} | Duration: ${title.duration}<br>
      <p>${title.description}</p>
      <button onclick="editTitle('${title._id}')">Edit</button>
      <button onclick="deleteTitle('${title._id}', '${title._rev}')">Delete</button>
    `;
        container.appendChild(div);
    });
}

async function addTitle() {
    const title = {
        show_id: document.getElementById('show_id').value,
        type: document.getElementById('type').value,
        title: document.getElementById('title').value,
        director: document.getElementById('director').value,
        country: document.getElementById('country').value,
        release_year: document.getElementById('release_year').value,
        rating: document.getElementById('rating').value,
        duration: document.getElementById('duration').value,
        description: document.getElementById('description').value,
        date_added: new Date().toISOString()
    };

    if (!title.show_id || !title.title) return alert("Show ID and Title are required.");

    await db.post(title);

    document.getElementById('show_id').value = '';
    document.getElementById('type').value = '';
    document.getElementById('title').value = '';
    document.getElementById('director').value = '';
    document.getElementById('country').value = '';
    document.getElementById('release_year').value = '';
    document.getElementById('rating').value = '';
    document.getElementById('duration').value = '';
    document.getElementById('description').value = '';

}

async function editTitle(id) {
    const doc = await db.get(id);
    const container = document.getElementById(`title-${id}`);

    container.innerHTML = `
    <form onsubmit="saveTitle('${id}'); return false;">
      <input type="text" id="title-${id}" value="${doc.title}" placeholder="Title" />
      <input type="text" id="director-${id}" value="${doc.director}" placeholder="Director" />
      <input type="text" id="type-${id}" value="${doc.type}" placeholder="Type" />
      <input type="text" id="country-${id}" value="${doc.country}" placeholder="Country" />
      <input type="text" id="release_year-${id}" value="${doc.release_year}" placeholder="Year" />
      <input type="text" id="rating-${id}" value="${doc.rating}" placeholder="Rating" />
      <input type="text" id="duration-${id}" value="${doc.duration}" placeholder="Duration" />
      <textarea id="description-${id}" placeholder="Description">${doc.description}</textarea>
      <button type="submit">Save</button>
      <button type="button" onclick="cancelEdit()">Cancel</button>
    </form>
  `;
}

async function saveTitle(id) {
    const doc = await db.get(id);

    doc.title = document.getElementById(`title-${id}`).value;
    doc.director = document.getElementById(`director-${id}`).value;
    doc.type = document.getElementById(`type-${id}`).value;
    doc.country = document.getElementById(`country-${id}`).value;
    doc.release_year = document.getElementById(`release_year-${id}`).value;
    doc.rating = document.getElementById(`rating-${id}`).value;
    doc.duration = document.getElementById(`duration-${id}`).value;
    doc.description = document.getElementById(`description-${id}`).value;

    await db.put(doc);

    showTitles();
}

function cancelEdit() {
    showTitles();
}

async function deleteTitle(id, rev) {
    await db.remove(id, rev);
}

const remoteDB = new PouchDB('http://admin:admin@localhost:5984/netflix_titles');

db.sync(remoteDB, {
    live: true,
    retry: true
}).on('change', function (change) {
    console.log('Documents synced:', change);
}).on('paused', function (info) {
    console.log('Replication paused:', info);
}).on('active', function (info) {
    console.log('Replication active — syncing resumed!');
}).on('error', function (err) {
    console.error('Replication error:', err);
});

showTitles();
