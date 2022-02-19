const { Client } = require('pg');
const client = new Client('postgres://localhost:5432/juicebox-dev');

async function getAllUsers() {
  const { rows } = await client.query(
    `SELECT id, username, name, location, active FROM users;`
  );
  return rows;
}

async function createUser({ username, password, name, location }) {
  try {
    const result = client.query(
      `
    INSERT INTO users(username, password, name, location) VALUES ($1, $2, $3, $4)
    ON CONFLICT (username) DO NOTHING
    RETURNING *;
        `,
      [username, password, name, location]
    );
    return result.rows;
  } catch (error) {
    throw error;
  }
}

async function createPost({ authorid, title, content, tags = [] }) {
  try {
    const {
      rows: [post],
    } = await client.query(
      `
      INSERT INTO posts (authorid, title, content)
      VALUES ($1, $2 ,$3)
      RETURNING *;
      `,
      [authorid, title, content]
    );

    const tagList = await createTags(tags);
    return await addTagsToPost(post.id, tagList);
  } catch (error) {
    throw error;
  }
}
async function updatePost(postid, fields = {}) {
  const { tags } = fields;
  delete fields.tags;

  const setString = Object.keys(fields)
    .map((key, index) => `"${key}" = $${index + 1}`)
    .join(', ');

  try {
    if (setString.length > 0) {
      const result = await client.query(
        `
        UPDATE posts
        SET ${setString}
        WHERE id = ${postid}
        RETURNING *;`,
        Object.values(fields)
      );
    }
    if (tags === undefined) {
      return await getPostById(postid);
    }

    const tagList = await createTags(tags);
    const tagListIdString = tagList.map((tag) => `${tag.id}`).join(', ');

    await client.query(
      `
    DELETE FROM post_tags
    WHERE tagid NOT IN (${tagListIdString})
    AND postid = $1;
    `,
      [postid]
    );
    await addTagsToPost(postid, tagList);
    return await getPostById(postid);
  } catch (error) {
    throw error;
  }
}
async function getAllPosts() {
  try {
    const { rows } = await client.query(`
      SELECT id FROM posts`);
    const posts = await Promise.all(rows.map((post) => getPostById(post.id)));
    return posts;
  } catch (error) {
    throw error;
  }
}
async function getPostsByUser(userId) {
  try {
    const { rows } = await client.query(`
        SELECT id FROM posts WHERE "authorid" = ${userId};`);
    const posts = await Promise.all(rows.map((post) => getPostById(post.id)));
    return posts;
  } catch (error) {
    throw error;
  }
}
async function getUserById(userId) {
  try {
    const { rows } = await client.query(`
        SELECT * FROM users WHERE id = ${userId}
        `);
    if (!rows || !rows.length) {
      return null;
    } else if (rows || rows.length) {
      delete rows[0].password;
      const posts = await getPostsByUser(rows[0].id);
      rows[0]['posts'] = posts;
      return rows;
    }
  } catch (error) {
    throw error;
  }
}

async function updateUser(id, fields = {}) {
  const setString = Object.keys(fields)
    .map((key, index) => `"${key}" = $${index + 1}`)
    .join(', ');

  if (setString.lenth === 0) {
    return;
  }

  try {
    const result = await client.query(
      `
      UPDATE users
      SET ${setString}
      WHERE id = ${id}
      RETURNING *;`,
      Object.values(fields)
    );
    return result.rows[0];
  } catch (error) {
    throw error;
  }
}
async function createTags(tagList) {
  if (tagList.length === 0) {
    return;
  }
  const insertValues = tagList.map((_, index) => `$${index + 1}`).join('),(');
  const selectValues = tagList.map((_, index) => `$${index + 1}`).join(', ');

  try {
    const result = await client.query(
      `
      INSERT INTO tags(name)
      VALUES (${insertValues})
      ON CONFLICT (name) DO NOTHING;
      `,
      tagList
    );

    const result2 = await client.query(
      `
      SELECT * FROM tags
      WHERE name IN (${selectValues})`,
      tagList
    );

    return result2.rows;
  } catch (error) {
    throw error;
  }
}

async function createPostTag(postid, tagid) {
  try {
    await client.query(
      `
        INSERT INTO post_tags(postid, tagid)
        VALUES ($1 , $2)
        ON CONFLICT (postid, tagid) DO NOTHING
        `,
      [postid, tagid]
    );
  } catch (error) {
    throw error;
  }
}
async function addTagsToPost(postid, tagList) {
  try {
    const createPostTagPromises = tagList.map((tag) =>
      createPostTag(postid, tag.id)
    );
    await Promise.all(createPostTagPromises);

    return await getPostById(postid);
  } catch (error) {
    throw error;
  }
}

async function getPostById(postid) {
  try {
    const {
      rows: [post],
    } = await client.query(
      `
      SELECT * FROM posts
      WHERE id = $1;
      `,
      [postid]
    );

    const { rows: tags } = await client.query(
      `
    SELECT tags.* FROM tags
    JOIN post_tags ON tags. id=post_tags.tagid
    WHERE post_tags.postid = $1;
    `,
      [postid]
    );
    const {
      rows: [author],
    } = await client.query(
      `
    SELECT id, username, name, location
    FROM users
    WHERE id = $1;
    `,
      [post.authorid]
    );

    post.tags = tags;
    post.author = author;

    delete post.authorid;

    console.log(post);
    return post;
  } catch (error) {
    throw error;
  }
}

async function getPostsByTagName(tagName) {
  try {
    const { rows: postids } = await client.query(
      `
    SELECT posts.id FROM posts
    JOIN post_tags ON posts.id=post_tags.postid
    JOIN tags ON tags.id=post_tags.tagid
    WHERE tags.name = $1;
    `,
      [tagName]
    );

    return await Promise.all(postids.map((post) => getPostById(post.id)));
  } catch (error) {
    throw error;
  }
}

module.exports = {
  client,
  getAllPosts,
  getPostsByUser,
  getUserById,
  getAllUsers,
  createUser,
  createPost,
  createTags,
  updateUser,
  updatePost,
  addTagsToPost,
  getPostsByTagName,
};
