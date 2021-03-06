import { Connection, EntityManager, IDatabaseDriver } from '@mikro-orm/core';
import { expect } from 'chai';
import { SuperTest, Test } from 'supertest';
import supertest = require('supertest');
import createSimpleUuid from 'utils/helpers/createSimpleUuid.helper';
import { clearDatabase } from 'utils/services/clearDatabase.service';
import { loadFixtures } from 'utils/services/loadFixtures.service';

import Application from 'application';

let request: SuperTest<Test>;
let application: Application;
let em: EntityManager<IDatabaseDriver<Connection>>;

describe('Author tests', async () => {
  before(async () => {
    application = new Application();
    await application.connect();
    await application.init();

    em = application.orm.em.fork();

    request = supertest(application.host);
  });

  beforeEach(async () => {
    await clearDatabase(application.orm);
    await loadFixtures(application.orm);
  });

  after(async () => {
    application.server.close();
  });

  it('should get authors', async () => {
    const response = await request
      .post('/graphql')
      .send({
        query: `query {
          getAuthors {
            id name email born
            books {
              id title
            }
          }
        }
        `,
      })
      .expect(200);

    expect(response.body.data.getAuthors).to.be.a('array');
  });

  it('should get author by id', async () => {
    const response = await request
      .post('/graphql')
      .send({
        query: `query {
          getAuthor(id: "${createSimpleUuid(1)}") {
            id name born email
            books {
              id title tags {
                id name
              }
            }
          }
        }
        `,
      })
      .expect(200);

    expect(response.body.data.getAuthor).to.be.a('object');
  });

  it('should create author', async () => {
    const response = await request
      .post('/graphql')
      .send({
        query: `mutation {
          addAuthor (
            input: {
              email: "email@email.com",
              name: "new author",
              born: "${new Date(new Date().setFullYear(1994)).toISOString()}"
            }
          ) {
            id name born email
            books {
              id title tags {
                id name
              }
            }
          }
        }
        `,
      })
      .expect(200);

    expect(response.body.data.addAuthor).to.be.a('object');
  });

  it('should update author', async () => {
    const response = await request
      .post('/graphql')
      .send({
        query: `mutation {
          updateAuthor (input: {
            email: "updated@email.com",
            name: "update name",
            born: "${new Date().toISOString()}"
          }, id: "${createSimpleUuid(1)}") {
            id name born email
            books {
              id title tags {
                id name
              }
            }
          }
        }
        `,
      })
      .expect(200);

    expect(response.body.data.updateAuthor).to.be.a('object');
  });

  it('should delete author', async () => {
    const response = await request
      .post('/graphql')
      .send({
        query: `mutation {
          deleteAuthor (id: "${createSimpleUuid(1)}")
        }
        `,
      })
      .expect(200);

    expect(response.body.data.deleteAuthor).to.be.true;
  });
});
