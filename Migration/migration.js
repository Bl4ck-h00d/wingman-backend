const pool = require("../Config/Database");
require("dotenv").config();

class Migrations {
  async fullTextSearch() {
    await pool.query(`
    update posts set search_document_with_weights = setweight(to_tsvector(title), 'A') ||
  setweight(to_tsvector(description), 'B') ||
  setweight(to_tsvector('english', array_to_string(tags, ' ')),'C') ||
    setweight(to_tsvector(coalesce(author, '')), 'D');
    
CREATE INDEX IF NOT EXISTS search_document_weights_idx ON posts USING GIN (search_document_with_weights);

drop function IF EXISTS post_tsvector_trigger CASCADE;
CREATE FUNCTION post_tsvector_trigger() RETURNS trigger AS $$
begin
  new.search_document_with_weights :=
  setweight(to_tsvector('english', coalesce(new.title, '')), 'A')
  || setweight(to_tsvector('english', coalesce(new.description, '')), 'B')
  || setweight(to_tsvector('english', array_to_string(new.tags, ' ')),'C')
  || setweight(to_tsvector('english', coalesce(new.author, '')), 'D');
  return new;
end
$$ LANGUAGE plpgsql;
CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
    ON posts FOR EACH ROW EXECUTE PROCEDURE post_tsvector_trigger();
        `);
  }

  async anonymousUser() {
    await pool.query(
      `INSERT INTO users (username,email,password,verified) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
      [
        process.env.ANONYMOUS_USER,
        process.env.ANONYMOUS_EMAIL,
        process.env.ANONYMOUS_PASSWORD,
        true,
      ]
    );
  }
}

module.exports = {
  Migrations,
};
