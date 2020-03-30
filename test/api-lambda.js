let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
chai.use(chaiHttp);
let app = require('../app');

describe("Lambda evaluator", function() {

    describe("Simple expression", function() {
      it("Simple substitutions to variable", function(done) {
        let request = {
            expression: "((λx.((λy.(x y))x))(λz.w))"
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
            expression: "(λx.λy.(x y))(λx.λy.(x y))"
        };

        chai.request(app)
            .post('/api/lambda/evaluate')
            .send(request)
            .end((err, res) => {
                  res.should.have.status(200);
                  res.body.result.should.be.a('string');
                  res.body.result.should.be.eql("(λy.(λt.yt))");
              done();
            });
      });
    });


});
