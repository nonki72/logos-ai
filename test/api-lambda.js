let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
chai.use(chaiHttp);
let app = require('../app');

describe("Lambda evaluator", function() {

    describe("Simple expression", function() {
      it("Simple substitutions to variable", function(done) {
        let request = {
            expression: "((&x.((&y.(xy))x))(&z.w))"
        };

        chai.request(app)
            .post('/api/lambda/evaluate')
            .send(request)
            .end((err, res) => {
                  res.should.have.status(200);
                  res.body.result.should.be.a('string');
                  res.body.result.should.be.eql("w");
              done();
            });
      });
    });

    describe("Simple expression", function() {
      it("Simple substitutions to variable", function(done) {
        let request = {
            expression: "(&x.&y.(xy))(&x.&y.(xy))"
        };

        chai.request(app)
            .post('/api/lambda/evaluate')
            .send(request)
            .end((err, res) => {
                  res.should.have.status(200);
                  res.body.result.should.be.a('string');
                  res.body.result.should.be.eql("\\y.\\a.ya");
              done();
            });
      });
    });


});
