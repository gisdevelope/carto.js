var Backbone = require('backbone');
var AnalysisFactory = require('../../../../../src/analysis/analysis-factory.js');
var CartoDBLayer = require('../../../../../src/geo/map/cartodb-layer');
var DataviewModelBase = require('../../../../../src/dataviews/dataview-model-base');
var AnonymousMapSerializer = require('../../../../../src/windshaft/map-serializer/anonymous-map-serializer/anonymous-map-serializer');

var MyDataviewModel = DataviewModelBase.extend({
  toJSON: function () {
    return {};
  }
});

fdescribe('anonymous-map-serializer', function () {
  describe('.serialize', function () {
    var visModel;
    var mapModel;
    var layersCollection;
    var dataviewsCollection;
    var analysisCollection;
    var analysisFactory;
    var analysisModel;
    var payload;

    beforeEach(function () {
      mapModel = new Backbone.Model();
      visModel = new Backbone.Model();

      // Analyses
      analysisCollection = new Backbone.Collection();
      analysisFactory = new AnalysisFactory({
        analysisCollection: analysisCollection,
        camshaftReference: fakeCamshaftReference,
        vis: visModel
      });
      analysisModel = analysisFactory.analyse({
        id: 'ANALYSIS_ID',
        type: 'source',
        params: {
          query: 'select * from subway_stops'
        }
      });

      // Layers
      var cartoDBLayer = new CartoDBLayer({
        id: 'LAYER_ID',
        source: analysisModel,
        cartocss: 'cartocssMock',
        cartocss_version: '2.0'
      }, {
        vis: visModel
      });
      layersCollection = new Backbone.Collection([ cartoDBLayer ]);

      // Dataviews
      var dataview = new MyDataviewModel({
        id: 'DATAVIEW_ID',
        source: { id: analysisModel.id }
      }, {
        map: mapModel,
        vis: visModel,
        analysisCollection: analysisCollection
      });
      dataviewsCollection = new Backbone.Collection([ dataview ]);

      // Serialized payload
      payload = AnonymousMapSerializer.serialize(layersCollection, dataviewsCollection);
    });

    it('should include buffersize', function () {
      expect(payload.buffersize).toEqual({
        mvt: 0
      });
    });

    it('should include one layer', function () {
      expect(payload.layers.length).toEqual(1);
      expect(payload.layers[0].id).toEqual('LAYER_ID');
    });

    it('should include one dataview', function () {
      expect(Object.keys(payload.dataviews).length).toEqual(1);
      expect(payload.dataviews['DATAVIEW_ID']).toBeDefined();
    });

    it('should include one analysis', function () {
      expect(payload.analyses.length).toEqual(1);
      expect(payload.analyses[0].id).toEqual('ANALYSIS_ID');
    });
  });
});

var fakeCamshaftReference = {
  getSourceNamesForAnalysisType: function (analysisType) {
    var map = {
      'source': [],
      'trade-area': ['source'],
      'estimated-population': ['source'],
      'point-in-polygon': ['points_source', 'polygons_source'],
      'union': ['source']
    };
    if (!map[analysisType]) {
      throw new Error('analysis type ' + analysisType + ' not supported');
    }
    return map[analysisType];
  },

  getParamNamesForAnalysisType: function (analysisType) {
    var map = {
      'source': ['query'],
      'trade-area': ['kind', 'time'],
      'estimated-population': ['columnName'],
      'point-in-polygon': [],
      'union': ['join_on']
    };
    if (!map[analysisType]) {
      throw new Error('analysis type ' + analysisType + ' not supported');
    }
    return map[analysisType];
  }
};
