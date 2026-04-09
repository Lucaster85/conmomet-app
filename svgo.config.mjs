export default {
  floatPrecision: 1,
  plugins: [
    {
      name: "preset-default",
      params: {
        overrides: {
          convertPathData: {
            floatPrecision: 1,
            transformPrecision: 1,
            makeArcs: {
              threshold: 2,
              tolerance: 0.5,
            },
          },
          mergePaths: true,
          removeUselessStrokeAndFill: true,
          cleanupIds: true,
          convertShapeToPath: true,
        },
      },
    },
  ],
};
