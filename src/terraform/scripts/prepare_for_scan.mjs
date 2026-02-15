import yaml from "./js-yaml.mjs";
import * as fs from "fs/promises";

(async () => {
  try {
    try {
      await fs.rm('./chart', {recursive: true, force: true});
    } catch {
      // ignored
    }
    await fs.mkdir('./chart');

    const planFile = process.argv[2];
    const planObject = JSON.parse(
      await fs.readFile(planFile, { encoding: "utf8" }),
    );
    const helmReleases = planObject.resource_changes.filter(x => x.type === 'helm_release').map(c => ({
        chartName: c.change.after.chart,
        releaseName: c.change.after.name,
        chartVersion: c.change.after.version,
        repositoryUrl: c.change.after.repository,
        values: {
          ['' + c.change.after.name]: yaml.load(c.change.after.values && c.change.after.values.filter(x => !!x).length > 0 ? c.change.after.values.filter(x => !!x).join('\n') : '')
        }
    }));

    const chartYamlObject = {
      apiVersion: 'v2',
      name: 'umbrella',
      description: 'something',
      version: '0.1.0',
      appVersion: '1.16.0',
      dependencies: helmReleases.map(x => ({
        name: x.chartName,
        alias: x.releaseName,
        repository: x.repositoryUrl,
        version: x.chartVersion
      }))
    };

    let valuesObject = {};
    for (const hr of helmReleases) {
      valuesObject = {...valuesObject, ...hr.values};
    }

    const writeValues = fs.writeFile('./chart/values.yaml', yaml.dump(valuesObject));
    const writeChartYaml = fs.writeFile('./chart/Chart.yaml', yaml.dump(chartYamlObject));
    const writeHelmIgnore = fs.writeFile('./chart/.helmignore', `.DS_Store
.git/
.gitignore
*.swp
*.bak
*.tmp
*.orig
*~
*.tmproj
.vscode/
`);
    await Promise.all([writeValues, writeChartYaml, writeHelmIgnore]);
    console.log('OK');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
