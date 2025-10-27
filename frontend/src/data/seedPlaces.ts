// Mock data from seed_places.csv
export const SEED_PLACES_DATA = `id,name,lat,lon,known_type,seed_url,access_notes,notes
1,Grand Canyon,36.1069,-112.1129,Stratigraphic canyon,https://en.wikipedia.org/wiki/Grand_Canyon,National Park with visitor centers and trails,Excellent exposed stratigraphic sequence spanning Precambrian to Cenozoic
2,Burgess_Shale,51.4969,-116.2125,Fossil Lagerstätte,https://en.wikipedia.org/wiki/Burgess_Shale,Access via Yoho NP trails & guided outings,Exceptional Cambrian soft-bodied fossils (Walcott quarry)
3,Ediacara_Hills,-29.2167,137.9167,Ediacaran fossil locality,https://en.wikipedia.org/wiki/Ediacaran_biota,Remote; some guided access,Important for late Precambrian multicellular life traces
4,Chengjiang,23.5,120.25,Fossil Lagerstätte,https://en.wikipedia.org/wiki/Chengjiang,Museum at site; controlled access,Early Cambrian fossils with soft-bodied preservation
5,Morrison_Formation,39.0,-105.5,Jurassic sedimentary formation,https://en.wikipedia.org/wiki/Morrison_Formation,Many public outcrops; museums nearby,Dinosaur-bearing fluvial-lacustrine deposits (Late Jurassic)
6,Solnhofen,48.8667,11.3333,Jurassic limestone beds,https://en.wikipedia.org/wiki/Solnhofen,Lithography museum & quarries accessible,Famous for Archaeopteryx and fine-grained limestones
7,Isua_Greenstone_Belt,67.3833,-51.8333,Archean metamorphic belt,https://en.wikipedia.org/wiki/Isua_Greenstone_Belt,Fieldwork access by arrangement,Oldest known supracrustal rocks (~3.7–3.8 Ga)
8,Karoo_Basin,-30.0,25.0,Permian–Triassic basin,https://en.wikipedia.org/wiki/Karoo_Basin,Several public localities and museums,Key for Permian–Triassic terrestrial records and mass-extinction studies
9,Deccan_Traps,19.0,74.0,Large igneous province,https://en.wikipedia.org/wiki/Deccan_Traps,Large area; some accessible outcrops,Extensive flood basalts linked to end-Cretaceous environmental changes
10,Vindhyan_Basin,23.0,81.0,Proterozoic sedimentary basin,https://en.wikipedia.org/wiki/Vindhya,Regional geosites and quarries,Important Proterozoic sequences in South Asia
11,Atacama_Desert_Fossils,-24.0,-69.0,Paleontological localities,https://en.wikipedia.org/wiki/Atacama_Desert,Remote desert access; guided tours for ichnofossils,Rich Mesozoic marine and terrestrial deposits in places
12,Vindhya_Group,23.5,80.5,Precambrian lithostratigraphy,https://opengeology.in/vindhyan-supergroup/,Access variable depending on exact outcrop,Important for Proterozoic stratigraphy (duplicate tag: refine later)
13,Jehol_Biota,41.7,120.9,Cretaceous Lagerstätte,https://en.wikipedia.org/wiki/Jehol_Biota,Museums and parks near Liaoning,Feathered dinosaurs and well-preserved Cretaceous ecosystems
14,Sinai_Stromatolites,28.5,33.8,Precambrian stromatolite reefs,https://en.wikipedia.org/wiki/Stromatolite,Coastal/quarry localities accessible,Records of early microbial mat communities
15,Old_Red_Sandstone,56.5,-3.5,Devonian terrestrial sequence,https://en.wikipedia.org/wiki/Old_Red_Sandstone,Many outcrops in UK & Scotland,Important record of Devonian continental deposits and early tetrapods
16,White_Cliffs_of_Dover,51.1279,1.3216,Cretaceous chalk cliffs,https://en.wikipedia.org/wiki/White_Cliffs_of_Dover,Coastal access; tourist trails,Chalk deposits representing Cretaceous carbonate shelf
17,Messel_Pit,49.9667,8.95,Eocene fossil pit,https://en.wikipedia.org/wiki/Messel_Pit,UNESCO site with museum,Exceptional Eocene vertebrate fossils
18,Charnwood_Forest,52.65,-1.2,Precambrian fossil locality,https://en.wikipedia.org/wiki/Charnwood_Forest,Parks accessible to public,Contains early Precambrian fossils (Charnia)
19,Mount_Paektu,-41.0,129.9,Volcanic province,https://en.wikipedia.org/wiki/Mount_Paektu,Remote; access restrictions in some areas,Volcanic stratigraphy and tephra used for tephrochronology
20,Grand_Staircase-Escalante,37.5,-112.5,Stratigraphic sequence & paleontol sites,https://en.wikipedia.org/wiki/Grand_Staircase-Escalante_National_Monument,Public monument with trails,Excellent continental Mesozoic stratigraphy and fossil localities`;

export interface SeedPlace {
  id: string;
  name: string;
  lat: number;
  lon: number;
  known_type: string;
  seed_url: string;
  access_notes: string;
  notes: string;
}

// Parse CSV data into objects
function parseCSV(csvText: string): SeedPlace[] {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj: any = {};
    
    headers.forEach((header, index) => {
      let value = values[index] || '';
      
      // Handle numeric fields
      if (header === 'lat' || header === 'lon') {
        obj[header] = parseFloat(value);
      } else {
        obj[header] = value;
      }
    });
    
    return obj as SeedPlace;
  });
}

export const PLACES_DATA = parseCSV(SEED_PLACES_DATA);