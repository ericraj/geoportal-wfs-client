const expect = require('chai').expect;
const Client = require('../../src/Client');

const config = require('../config');

const client = new Client({
    "apiKey": config.GEOPORTAL_API_KEY,
    "url": config.GEOPORTAL_WFS_URL,
    "referer": config.GEOPORTAL_REFERER
});

describe(`Functional tests on ${config.GEOPORTAL_WFS_URL}`, function () {

    it('should return an array for getTypeNames with CADASTRALPARCELS.PARCELLAIRE_EXPRESS:parcelle', async function () {
        let typeNames = await client.getTypeNames();
        expect(typeNames).to.be.an('array');
        expect(typeNames).to.include('CADASTRALPARCELS.PARCELLAIRE_EXPRESS:parcelle');
    });

    it('should throw a nice error getFeatures("TYPE_NOT_FOUND")', async function () {
        try {
            await client.getFeatures("TYPE_NOT_FOUND");
        }catch(e){
            expect(e).to.be.an('object');
            expect(e).to.have.property('type');
            expect(e.type).to.equal("error");
            expect(e).to.have.property('message');
            expect(e.message).to.equal(
                '<ExceptionReport><Exception exceptionCode="MissingRights">No rights for this ressource or ressource does not exist</Exception></ExceptionReport>'
            );
        }
    });


    it('should return a FeatureCollection for getFeatures("CADASTRALPARCELS.PARCELLAIRE_EXPRESS:parcelle",{"code_dep":"25"})', async function () {
        this.skip('see issue #5 - performance issue due to a PostgreSQL per code_insee behind CADASTRALPARCELS.PARCELLAIRE_EXPRESS:parcelle (same problem previously with BDPARCELLAIRE-VECTEUR_WLD_BDD_WGS84G:parcelle and one schema per code_dep)?');
        var featureCollection = await client.getFeatures(
            "CADASTRALPARCELS.PARCELLAIRE_EXPRESS:parcelle",
            {
                "code_dep": "25",
                "_limit": 1
            }
        );
        expect(featureCollection).to.have.property('type');
        expect(featureCollection['type']).to.equal("FeatureCollection");
    });


    it('should return a FeatureCollection for getFeatures("CADASTRALPARCELS.PARCELLAIRE_EXPRESS:parcelle",{"code_insee":"25349"})', async function () {
        var featureCollection = await client.getFeatures(
            "CADASTRALPARCELS.PARCELLAIRE_EXPRESS:parcelle",
            {
                "code_insee": "25349",
                "_limit": 1
            }
        );
        expect(featureCollection).to.have.property('type');
        expect(featureCollection['type']).to.equal("FeatureCollection");
    });

    it('should work with a "large" geometry ', async function () {
        const filterGeom = require('../data/filter-geom-01.json');
        var featureCollection = await client.getFeatures(
            "CADASTRALPARCELS.PARCELLAIRE_EXPRESS:parcelle",
            {
                "geom": filterGeom,
                "_limit": 10
            }
        );

        expect(featureCollection).to.have.property('type');
        expect(featureCollection['type']).to.equal("FeatureCollection");
        expect(featureCollection).to.have.property('features');
        expect(featureCollection['features']).to.be.an('array');
        expect(featureCollection['features'].length).to.be.greaterThan(1);

        featureCollection['features'].map(feature => {
            expect(feature.properties).to.have.property('code_dep');
            expect(feature.properties).to.have.property('code_com');
            expect(feature.properties['code_dep']).to.equal('25');
            expect(feature.properties['code_com']).to.equal('349');
        });
    });

    it('should return a FeatureCollection with null geometry)', async function () {
        var featureCollection = await client.getFeatures(
            "CADASTRALPARCELS.PARCELLAIRE_EXPRESS:parcelle",
            {
                "code_insee": "25349",
                "_propertyNames": ["numero","feuille"]
            }
        );

        featureCollection['features'].map(feature => {
            expect(feature.geometry).to.equal(null);
            expect(feature.properties).to.have.property('numero');
            expect(feature.properties).to.have.property('feuille');
            expect(feature.properties).to.not.have.property('code_dep');
        });
    });

});
