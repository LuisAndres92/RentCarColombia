/**
 * Catálogo Profundo de Marcas, Modelos, Carrocerías y Versiones (Colombia & Mercado Global)
 * Usado por el autocompletado y la detección inteligente de categoría y capacidad.
 */
(function () {
    const CAR_CATALOG_BY_BRAND = {
        'Renault': [
            'Kwid Zen', 'Kwid Intens', 'Kwid Outsider', 'Kwid E-Tech Eléctrico',
            'Sandero Life HB', 'Sandero Zen HB', 'Sandero Intens HB', 'Sandero RS HB',
            'Sandero Stepway Zen', 'Sandero Stepway Intens',
            'Logan Life Sedán', 'Logan Zen Sedán', 'Logan Intens Sedán',
            'Kardian Evolution', 'Kardian Techno', 'Kardian Premiere Edition',
            'Duster Zen 4x2', 'Duster Intens 4x2', 'Duster Iconic 4x2', 'Duster Iconic Turbo 4x4',
            'Oroch Cargo 4x2', 'Oroch Zen 4x2', 'Oroch Intens Outsider 4x4',
            'Captur Zen', 'Captur Intens', 'Captur Bose',
            'Arkana Techno Hybrid', 'Arkana Esprit Alpine Hybrid',
            'Koleos Zen', 'Koleos Intens 4x4', 'Koleos Initiale Paris',
            'Megane E-Tech Eléctrico', 'Kangoo', 'Master', 'Trafic', 'Alaskan Intens 4x4'
        ],
        'Chevrolet': [
            'Spark Life HB', 'Spark GT LT HB', 'Spark GT LTZ HB', 'Spark GT Activ HB',
            'Beat LS Sedán', 'Beat LT Sedán', 'Beat LTZ Sedán',
            'Joy HB', 'Joy Sedán',
            'Sail LS Sedán', 'Sail LT Sedán', 'Sail LTZ Sedán',
            'Onix LT Sedán', 'Onix LTZ Sedán', 'Onix Turbo LT Sedán', 'Onix Turbo LTZ Sedán', 'Onix Turbo Premier Sedán',
            'Onix Turbo LT HB', 'Onix Turbo LTZ HB', 'Onix Turbo RS HB',
            'Aveo Family Sedán', 'Aveo Emotion Sedán', 'Cruze LT Sedán', 'Cruze Premier Sedán', 'Cruze HB',
            'Tracker LS Turbo', 'Tracker LTZ Turbo', 'Tracker Premier Turbo', 'Tracker RS Turbo',
            'Captiva Turbo LT', 'Captiva Turbo Premier (7 puestos)',
            'Equinox LS', 'Equinox Premier AWD', 'Equinox RS', 'Equinox EV',
            'Blazer RS AWD', 'Blazer EV',
            'Trailblazer LTZ 4x4 (7 puestos)', 'Traverse Premier AWD (8 puestos)', 'Tahoe High Country 4x4 (8 puestos)',
            'Montana LTZ Turbo', 'Colorado LTZ 4x4', 'Colorado High Country 4x4', 'N300', 'N400'
        ],
        'Mazda': [
            'Mazda 2 Sedán Touring', 'Mazda 2 Sedán Grand Touring', 'Mazda 2 Sedán Grand Touring LX',
            'Mazda 2 HB Touring', 'Mazda 2 HB Grand Touring', 'Mazda 2 HB Grand Touring LX', 'Mazda 2 HB Carbon Edition',
            'Mazda 3 Sedán Prime', 'Mazda 3 Sedán Touring', 'Mazda 3 Sedán Grand Touring', 'Mazda 3 Sedán Grand Touring LX', 'Mazda 3 Sedán Mild-Hybrid',
            'Mazda 3 HB Touring', 'Mazda 3 HB Grand Touring', 'Mazda 3 HB Grand Touring LX', 'Mazda 3 HB Carbon Edition', 'Mazda 3 HB Turbo AWD',
            'Mazda 6 Sedán Touring', 'Mazda 6 Sedán Grand Touring', 'Mazda 6 Sedán Signature',
            'CX-3 Touring', 'CX-3 Grand Touring', 'CX-3 Grand Touring LX',
            'CX-30 Prime', 'CX-30 Touring', 'CX-30 Grand Touring', 'CX-30 Grand Touring LX', 'CX-30 Grand Touring AWD', 'CX-30 Carbon Edition',
            'CX-5 Touring', 'CX-5 Grand Touring', 'CX-5 Grand Touring LX AWD', 'CX-5 Carbon Edition', 'CX-5 Signature Turbo AWD',
            'CX-50 Grand Touring', 'CX-50 Grand Touring LX AWD',
            'CX-60 Grand Touring Signature PHEV', 'CX-9 Grand Touring Signature (7 puestos)', 'CX-90 Grand Touring Signature (7 puestos)',
            'MX-5 Miata Roadster', 'BT-50 4x4'
        ],
        'Toyota': [
            'Yaris HB XS', 'Yaris HB XLS', 'Yaris HB GR-Sport',
            'Yaris Sedán XS', 'Yaris Sedán XLS', 'Yaris Cross Hybrid',
            'Corolla Sedán XLI', 'Corolla Sedán XEI', 'Corolla Sedán SEG Hybrid', 'Corolla Sedán GR-Sport',
            'Corolla HB XSE', 'Corolla Cross XLI', 'Corolla Cross XEI Hybrid', 'Corolla Cross SEG Hybrid',
            'Prius Hybrid', 'Camry Hybrid XLE',
            'Raize XLE', 'Rush (7 puestos)',
            'RAV4 LE', 'RAV4 XLE Hybrid', 'RAV4 Limited Hybrid AWD',
            'Fortuner SR 4x2 (7 puestos)', 'Fortuner SRV 4x4 (7 puestos)', 'Fortuner Legender 4x4 (7 puestos)',
            'SW4 Diamond 4x4 (7 puestos)',
            '4Runner SR5 4x4 (7 puestos)', '4Runner Limited 4x4 (7 puestos)',
            'Land Cruiser Prado TX 4x4 (7 puestos)', 'Land Cruiser Prado TX-L 4x4 (7 puestos)', 'Land Cruiser Prado VX 4x4 (7 puestos)',
            'Land Cruiser 300 VX 4x4 (7 puestos)', 'Sequoia Capstone Hybrid (8 puestos)',
            'Hilux Chasis', 'Hilux Doble Cabina 4x2', 'Hilux SR 4x4', 'Hilux SRV 4x4', 'Hilux GR-Sport 4x4',
            'Tacoma TRD Sport 4x4', 'Tundra Platinum 4x4', 'Hiace (15 puestos)'
        ],
        'Kia': [
            'Picanto Emotion HB', 'Picanto Vibrant HB', 'Picanto Zenith HB', 'Picanto GT-Line HB', 'Picanto X-Line HB',
            'Soluto Emotion Sedán', 'Soluto Vibrant Sedán',
            'Rio Sedán Emotion', 'Rio Sedán Vibrant', 'Rio Sedán Zenith',
            'Rio HB Emotion', 'Rio HB Vibrant', 'Rio HB Zenith', 'Rio HB GT-Line',
            'K3 Sedán Desire', 'K3 Sedán Vibrant', 'K3 Sedán Zenith', 'K3 Sedán GT-Line',
            'K3 Cross HB Vibrant', 'K3 Cross HB Zenith', 'K3 Cross HB GT-Line',
            'Cerato Sedán Vibrant', 'Cerato Sedán Zenith', 'Cerato Sedán GT-Line', 'Forte Sedán', 'Stinger GT',
            'Sonet Vibrant', 'Sonet Zenith', 'Stonic Hybrid',
            'Seltos Emotion', 'Seltos Vibrant', 'Seltos Zenith', 'Seltos GT-Line',
            'Niro Hybrid Vibrant', 'Niro Hybrid Zenith', 'Niro EV',
            'Sportage Desire', 'Sportage Vibrant', 'Sportage Zenith', 'Sportage GT-Line AWD', 'Sportage Hybrid',
            'Sorento Vibrant (7 puestos)', 'Sorento Zenith AWD (7 puestos)', 'Carnival EX (8 puestos)', 'Telluride SX (8 puestos)',
            'EV5', 'EV6 GT-Line', 'EV9 GT-Line (7 puestos)'
        ],
        'Hyundai': [
            'Grand i10 HB Advance', 'Grand i10 HB Premium', 'Grand i10 Sedán Advance',
            'HB20 Getz HB', 'HB20 Graviti HB', 'HB20S Accent Sedán',
            'i20 HB', 'Accent Sedán GL', 'Accent Sedán GLS',
            'Elantra Sedán GLS', 'Elantra Sedán Limited', 'Elantra N-Line', 'Sonata Limited',
            'Venue Limited', 'Creta Advance', 'Creta Premium', 'Creta Grand (7 puestos)',
            'Kona Hybrid Limited', 'Kona Eléctrico',
            'Tucson Advance', 'Tucson Premium', 'Tucson Limited AWD', 'Tucson Hybrid',
            'Santa Fe Premium (7 puestos)', 'Santa Fe Calligraphy (7 puestos)',
            'Palisade Calligraphy (8 puestos)', 'Staria (11 puestos)', 'Ioniq 5', 'Ioniq 6'
        ],
        'Nissan': [
            'March Sense HB', 'March Advance HB', 'March Exclusive HB',
            'Versa Sense Sedán', 'Versa Advance Sedán', 'Versa Exclusive Sedán', 'Versa SR Sedán',
            'Sentra Sense Sedán', 'Sentra Advance Sedán', 'Sentra SR Sedán', 'Sentra Exclusive Sedán',
            'Altima SR Sedán', 'Leaf Eléctrico HB',
            'Kicks Sense', 'Kicks Advance', 'Kicks Exclusive', 'Kicks Play',
            'Qashqai Sense', 'Qashqai Advance', 'Qashqai Exclusive AWD',
            'X-Trail Sense', 'X-Trail Advance', 'X-Trail Exclusive (7 puestos)', 'X-Trail e-Power',
            'Pathfinder Exclusive (7 puestos)', 'Murano', 'Patrol Royale V8 4x4 (7 puestos)',
            'Frontier S 4x2', 'Frontier XE 4x4', 'Frontier LE 4x4', 'Frontier PRO-4X 4x4', 'NP300'
        ],
        'Suzuki': [
            'Alto 800 HB', 'S-Presso GL HB', 'Celerio GLX HB',
            'Swift GL HB', 'Swift GLX HB', 'Swift Hybrid HB', 'Swift Sport HB',
            'Swift Dzire GL Sedán', 'Swift Dzire GLX Sedán',
            'Baleno GL HB', 'Baleno GLX HB', 'Ignis GLX',
            'Fronx GLX Hybrid', 'Jimny GLX 4x4 (3 puertas)', 'Jimny 5 Puertas GLX 4x4',
            'Vitara Live', 'Vitara AllGrip 4x4', 'Grand Vitara GLX Hybrid',
            'S-Cross GLX Turbo', 'XL7 GLX (7 puestos)', 'Ertiga GLX (7 puestos)'
        ],
        'Volkswagen': [
            'Gol Trendline HB', 'Gol Comfortline HB', 'Voyage Trendline Sedán',
            'Polo Track HB', 'Polo Comfortline HB', 'Polo Highline TSI HB', 'Polo GTS HB',
            'Virtus Trendline Sedán', 'Virtus Comfortline Sedán', 'Virtus Highline TSI Sedán',
            'Golf Comfortline HB', 'Golf Highline HB', 'Golf GTI HB', 'Golf R HB',
            'Jetta Trendline Sedán', 'Jetta Comfortline Sedán', 'Jetta Highline Sedán', 'Jetta GLI Sedán',
            'Nivus Comfortline TSI', 'Nivus Highline TSI',
            'T-Cross Trendline', 'T-Cross Comfortline', 'T-Cross Highline TSI',
            'Taos Comfortline', 'Taos Highline',
            'Tiguan Life', 'Tiguan Elegance 4Motion (7 puestos)', 'Tiguan R-Line (7 puestos)',
            'Teramont Highline 4Motion (7 puestos)', 'Touareg R-Line', 'ID.4 Eléctrico',
            'Saveiro Cabina Doble', 'Amarok Comfortline 4x4', 'Amarok Highline V6 4x4', 'Amarok Extreme V6 4x4'
        ],
        'Ford': [
            'Fiesta SE HB', 'Fiesta Titanium HB', 'Fiesta SE Sedán', 'Fiesta Titanium Sedán', 'Fiesta ST HB',
            'Focus SE HB', 'Focus Titanium HB', 'Focus SE Sedán', 'Focus Titanium Sedán',
            'Mustang GT Coupé', 'Mustang Dark Horse', 'Mustang Mach-E GT Eléctrico',
            'EcoSport SE', 'EcoSport Titanium', 'EcoSport Storm 4x4',
            'Escape SE Hybrid', 'Escape Titanium Hybrid AWD', 'Escape ST-Line',
            'Bronco Sport Big Bend 4x4', 'Bronco Sport Wildtrak 4x4', 'Bronco Wildtrak 4x4',
            'Edge SEL', 'Edge Titanium', 'Edge ST',
            'Explorer XLT (7 puestos)', 'Explorer Limited 4x4 (7 puestos)', 'Explorer ST (7 puestos)',
            'Expedition Limited 4x4 (8 puestos)',
            'Maverick XLT', 'Maverick Lariat Hybrid',
            'Ranger XL 4x4', 'Ranger XLT 4x4', 'Ranger Limited V6 4x4', 'Ranger Raptor 4x4',
            'F-150 XLT 4x4', 'F-150 Lariat Hybrid 4x4', 'F-150 Raptor 4x4', 'Transit (15 puestos)'
        ],
        'Honda': [
            'City LX Sedán', 'City EX-L Sedán', 'City Touring HB',
            'Civic LX Sedán', 'Civic EX-L Sedán', 'Civic Touring Sedán', 'Civic Hybrid', 'Civic HB Sport', 'Civic Type R HB',
            'Accord EX-L Sedán', 'Accord Touring Hybrid Sedán',
            'WR-V EX', 'HR-V X-TYLE', 'HR-V Touring', 'ZR-V Touring',
            'CR-V City', 'CR-V EX-L AWD', 'CR-V Touring Hybrid AWD',
            'Pilot Touring AWD (7 puestos)', 'Passport', 'Ridgeline RTL 4x4'
        ],
        'Mitsubishi': [
            'Mirage GLX HB', 'Mirage G4 Sedán',
            'ASX 4x2', 'ASX 4x4', 'Eclipse Cross GLX', 'Eclipse Cross GLS AWD',
            'Outlander GLS', 'Outlander Limited AWD (7 puestos)', 'Outlander PHEV',
            'Montero Sport 4x2 (7 puestos)', 'Montero Sport Takai 4x4 (7 puestos)',
            'L200 Sportero 4x4', 'L200 Triton GLS 4x4'
        ],
        'Jeep': [
            'Renegade Sport', 'Renegade Longitude', 'Renegade Trailhawk 4x4',
            'Compass Sport', 'Compass Longitude', 'Compass Limited', 'Compass Trailhawk 4x4',
            'Cherokee Longitude', 'Cherokee Limited 4x4',
            'Grand Cherokee Laredo', 'Grand Cherokee Limited 4x4', 'Grand Cherokee L (7 puestos)',
            'Commander Overland 4x4 (7 puestos)',
            'Wrangler Sport 4x4', 'Wrangler Sahara 4x4', 'Wrangler Rubicon 4x4', 'Gladiator Rubicon 4x4'
        ],
        'Peugeot': [
            '208 Active HB', '208 Allure HB', '208 GT Turbo HB', 'e-208 GT Eléctrico HB',
            '2008 Active', '2008 Allure', '2008 GT Turbo', 'e-2008 GT Eléctrico',
            '3008 Active', '3008 Allure', '3008 GT',
            '5008 Allure (7 puestos)', '5008 GT (7 puestos)',
            'Partner', 'Expert', 'Landtrek 4x4'
        ],
        'Citroën': [
            'C3 Live HB', 'C3 Feel HB', 'C3 Shine Turbo HB',
            'C3 Aircross Feel', 'C3 Aircross Shine (7 puestos)',
            'C4 Cactus Feel', 'C4 Cactus Shine Turbo',
            'C5 Aircross Feel', 'C5 Aircross Shine', 'Berlingo', 'Jumpy'
        ],
        'Fiat': [
            'Mobi Like HB', 'Mobi Trekking HB',
            'Argo Drive HB', 'Argo Trekking HB',
            'Cronos Drive Sedán', 'Cronos Precision Sedán',
            '500 Dolcevita HB', '500e Eléctrico HB',
            'Pulse Drive', 'Pulse Audace Turbo', 'Pulse Impetus Turbo', 'Pulse Abarth',
            'Fastback Audace Turbo', 'Fastback Impetus Turbo',
            'Strada Freedom', 'Strada Volcano', 'Toro Volcano 4x4', 'Fiorino'
        ],
        'BYD': [
            'Seagull GL Eléctrico HB', 'Seagull GS Eléctrico HB',
            'Dolphin Mini Eléctrico HB', 'Dolphin Eléctrico HB', 'Dolphin Plus HB',
            'Yuan Up Eléctrico', 'Yuan Plus Eléctrico', 'Atto 3 Eléctrico',
            'Song Pro DM-i Híbrido', 'Song Plus DM-i Híbrido', 'Song Plus EV',
            'Seal AWD Eléctrico Sedán', 'Han EV Eléctrico Sedán',
            'Tang EV 4x4 (7 puestos)', 'Shark DM-O Pickup 4x4'
        ],
        'Chery': [
            'eQ1 Eléctrico HB', 'Arrizo 5 Sedán',
            'Tiggo 2 Pro', 'Tiggo 4 Pro Mild-Hybrid', 'Tiggo 4 Pro Luxury',
            'Tiggo 7 Pro Mild-Hybrid', 'Tiggo 7 Pro PHEV',
            'Tiggo 8 Pro (7 puestos)', 'Tiggo 8 Pro Max AWD (7 puestos)'
        ],
        'MG': [
            'MG 3 HB', 'MG 3 Hybrid+ HB',
            'MG 4 Eléctrico HB', 'MG 4 XPower AWD HB',
            'MG 5 Sedán', 'MG GT Sedán',
            'MG ZS STD', 'MG ZS Luxury', 'MG ZS EV Eléctrico',
            'MG HS Trophy', 'MG RX5', 'MG One', 'Cyberster Roadster'
        ],
        'JAC': [
            'E10X Eléctrico HB', 'JS2 Luxury', 'JS3 Intelligent', 'JS4 Luxury',
            'JS6 Flagship', 'JS8 Luxury (7 puestos)', 'T6 4x4', 'T8 Pro 4x4', 'T9 4x4'
        ],
        'Changan': [
            'Alsvin Sedán', 'CS15', 'CS35 Plus Turbo', 'CS55 Plus Turbo',
            'UNI-T', 'UNI-K AWD', 'Hunter 4x4 Pickup'
        ],
        'Great Wall / Haval': [
            'Ora 03 Eléctrico HB', 'Haval Jolion', 'Haval Jolion Hybrid',
            'Haval H6', 'Haval H6 Hybrid', 'Haval Dargo 4x4',
            'Poer 4x4', 'Wingle 5 4x4', 'Wingle 7 4x4'
        ],
        'SsangYong / KGM': [
            'Tivoli', 'Korando', 'Torres 4x2', 'Torres AWD', 'Torres EVX',
            'Rexton G4 4x4 (7 puestos)', 'Actyon', 'Musso Grand 4x4'
        ],
        'Subaru': [
            'Impreza HB', 'Impreza Sedán', 'WRX Sedán AWD',
            'Crosstrek AWD', 'XV AWD', 'Forester AWD', 'Forester Hybrid AWD',
            'Outback Touring XT AWD', 'Evoltis Limited AWD (7 puestos)'
        ],
        'BMW': [
            '118i HB', '128ti HB', 'M135i xDrive HB',
            '218i Gran Coupé Sedán', '220i Coupé', 'M240i Coupé', 'M2 Coupé',
            '320i Sedán', '330i M Sport Sedán', '330e Hybrid Sedán', 'M340i xDrive', 'M3 Competition',
            '420i Gran Coupé', '430i Coupé', 'M4 Competition', 'i4 eDrive40',
            '520i Sedán', '530i M Sport Sedán',
            'X1 sDrive18i', 'X1 xDrive25e', 'iX1', 'X2 M35i',
            'X3 xDrive30i', 'X3 M40i', 'iX3',
            'X4 xDrive30i', 'X5 xDrive40i', 'X5 xDrive45e', 'X6 xDrive40i', 'X7 xDrive40i (7 puestos)',
            'Z4 sDrive30i Roadster'
        ],
        'Mercedes-Benz': [
            'A 200 HB', 'A 250 AMG Line HB', 'A 35 AMG HB',
            'A 200 Sedán', 'A 250 AMG Line Sedán', 'A 35 AMG Sedán',
            'CLA 200 Coupé', 'CLA 250 AMG Line', 'CLA 35 AMG',
            'C 200 Sedán', 'C 300 AMG Line Sedán', 'E 200 Sedán', 'E 350 Sedán', 'S 500 Sedán',
            'GLA 200', 'GLA 250 4MATIC', 'EQA 250 Eléctrico',
            'GLB 200 (7 puestos)', 'GLB 250 4MATIC (7 puestos)', 'EQB 300 (7 puestos)',
            'GLC 200 4MATIC', 'GLC 300 4MATIC', 'GLC 300 Coupé',
            'GLE 450 4MATIC', 'GLE 450 Coupé', 'GLS 450 4MATIC (7 puestos)', 'Clase G 500 4x4',
            'EQE Sedán', 'Vito Tourer', 'Sprinter (15 puestos)'
        ],
        'Audi': [
            'A1 Sportback HB', 'A3 Sportback HB', 'A3 Sedán', 'S3 Sedán', 'RS 3',
            'A4 Sedán', 'A5 Sportback', 'A6 Sedán',
            'Q2', 'Q3', 'Q3 Sportback', 'Q5', 'Q5 Sportback',
            'Q7 (7 puestos)', 'Q8', 'Q4 e-tron', 'Q8 e-tron',
            'TT Coupé', 'R8 Coupé'
        ],
        'Volvo': [
            'EX30 Eléctrico', 'XC40 Recharge', 'EX40 Eléctrico', 'C40 Recharge',
            'XC60 Recharge PHEV', 'XC90 Recharge PHEV (7 puestos)', 'S60 Sedán'
        ],
        'Land Rover': [
            'Defender 90 4x4', 'Defender 110 4x4 (7 puestos)', 'Defender 130 4x4 (8 puestos)',
            'Discovery Sport (7 puestos)', 'Discovery HSE (7 puestos)',
            'Range Rover Evoque', 'Range Rover Velar', 'Range Rover Sport', 'Range Rover Autobiography'
        ],
        'Porsche': [
            'Macan', 'Macan S', 'Macan Electric',
            'Cayenne', 'Cayenne Coupé', 'Cayenne E-Hybrid',
            'Panamera', 'Taycan', '911 Carrera', '911 Turbo S', '718 Boxster', '718 Cayman'
        ],
        'MINI': [
            'Cooper 3 Puertas HB', 'Cooper S 3 Puertas HB', 'John Cooper Works HB',
            'Cooper 5 Puertas HB', 'Cooper Electric SE HB',
            'Clubman HB', 'Countryman Cooper', 'Countryman ALL4', 'Aceman Electric'
        ],
        'Seat': ['Ibiza Style HB', 'Ibiza FR HB', 'León Style HB', 'León FR HB', 'Arona Style', 'Arona FR', 'Ateca Style', 'Ateca FR', 'Tarraco FR (7 puestos)'],
        'Cupra': ['Formentor', 'Formentor VZ', 'León HB', 'Ateca', 'Terramar', 'Born Eléctrico HB'],
        'Opel': ['Corsa Edition HB', 'Corsa GS Line HB', 'Mokka GS Line', 'Crossland', 'Grandland'],
        'Dodge': ['Journey', 'Durango GT (7 puestos)', 'Durango R/T (7 puestos)', 'Charger Sedán', 'Challenger Coupé'],
        'RAM': ['700 SLT', '700 Laramie', '1000 Rebel 4x4', 'Rampage R/T 4x4', '1500 Laramie 4x4', '1500 TRX 4x4', '2500 Laramie 4x4', 'ProMaster'],
        'Foton': ['Tunland G7 4x4', 'Tunland V7 4x4', 'Tunland V9 4x4', 'View CS2 (15 puestos)'],
        'Jetour': ['X70 (7 puestos)', 'X70 Plus (7 puestos)', 'X90 Plus (7 puestos)', 'Dashing', 'T2 4x4'],
        'Geely': ['Coolray', 'Azkarra', 'Okavango (7 puestos)', 'Geometry C Eléctrico', 'EX5 Eléctrico'],
        'Deepal': ['S07 Max', 'S07 Eléctrico', 'S05', 'L07 Sedán'],
        'Zeekr': ['001', 'X', '009 (7 puestos)', '7X'],
        'Omoda / Jaecoo': ['Omoda 5', 'Omoda E5 Eléctrico', 'Jaecoo 7', 'Jaecoo 8 (7 puestos)'],
        'Tesla': ['Model 3 Standard', 'Model 3 Long Range', 'Model Y Long Range', 'Model Y Performance', 'Model S', 'Model X (7 puestos)', 'Cybertruck']
    };

    function normText(s) {
        return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    }

    /**
     * Devuelve { categories: [...], defaultCategory: '...', maxSeats: N, defaultSeats: N }
     * Soporta modelos con múltiples carrocerías (ej. Mazda 3 -> ['Sedán', 'Compacto']).
     */
    function detectVehicleSpecs(brand, model) {
        const m = normText(model);
        const b = normText(brand);
        if (!m) return null;

        // 1. Detección explícita de puestos si viene en el texto (ej. "(7 puestos)", "(15 puestos)")
        const seatsMatch = m.match(/\((\d+)\s*puestos\)/);
        const explicitSeats = seatsMatch ? parseInt(seatsMatch[1], 10) : null;

        // 2. Deportivos de 2 o 4 plazas
        if (['mx-5', 'miata', 'z4', '718 boxster', '718 cayman', 'r8', 'cyberster'].some(x => m.includes(x))) {
            return { categories: ['Deportivo / Lujo'], defaultCategory: 'Deportivo / Lujo', maxSeats: 2, defaultSeats: 2 };
        }
        if (m.includes('911') || m === 'tt' || m.startsWith('tt ') || m.includes('challenger') || m.includes('m2 ') || m === 'm2' || m.includes('m4 ') || m === 'm4' || m.includes('220i coupe') || m.includes('m240i')) {
            return { categories: ['Deportivo / Lujo'], defaultCategory: 'Deportivo / Lujo', maxSeats: 4, defaultSeats: 4 };
        }
        if (m.includes('mustang mach-e')) {
            return { categories: ['SUV / Camioneta', 'Deportivo / Lujo'], defaultCategory: 'SUV / Camioneta', maxSeats: 5, defaultSeats: 5 };
        }
        if (m.includes('mustang')) {
            return { categories: ['Deportivo / Lujo'], defaultCategory: 'Deportivo / Lujo', maxSeats: 4, defaultSeats: 4 };
        }
        if (['stinger', 'panamera', 'taycan', 'charger', 'm3 ', 'rs 3'].some(x => m.includes(x))) {
            return { categories: ['Deportivo / Lujo', 'Sedán'], defaultCategory: 'Deportivo / Lujo', maxSeats: 5, defaultSeats: 5 };
        }

        // 3. Pickups
        const pickups = ['oroch', 'alaskan', 'colorado', 'montana', 'bt-50', 'hilux', 'tacoma', 'tundra', 'frontier', 'np300', 'amarok', 'saveiro', 'maverick', 'ranger', 'f-150', 'ridgeline', 'l200', 'triton', 'gladiator', 'landtrek', 'strada', 'toro', 'shark', 't6', 't8', 't9', 'hunter', 'poer', 'wingle', 'musso', '700 ', '1000 ', '1500 ', '2500 ', 'rampage', 'tunland', 'cybertruck'];
        if (pickups.some(x => m === x.trim() || m.includes(x))) {
            const maxS = (m.includes('saveiro') || m.includes('strada') || m.includes('chasis')) ? 2 : 5;
            return { categories: ['Pickup'], defaultCategory: 'Pickup', maxSeats: maxS, defaultSeats: maxS };
        }

        // 4. Vans / 7-15 puestos
        if (['hiace', 'sprinter', 'transit', 'view cs2', 'master', 'trafic'].some(x => m.includes(x))) {
            return { categories: ['SUV / Camioneta'], defaultCategory: 'SUV / Camioneta', maxSeats: 15, defaultSeats: explicitSeats || 12 };
        }
        if (['sequoia', 'traverse', 'tahoe', 'carnival', 'telluride', 'palisade', 'expedition', 'defender 130'].some(x => m.includes(x))) {
            return { categories: ['SUV / Camioneta'], defaultCategory: 'SUV / Camioneta', maxSeats: 8, defaultSeats: 8 };
        }
        if (m.includes('staria')) {
            return { categories: ['SUV / Camioneta'], defaultCategory: 'SUV / Camioneta', maxSeats: 11, defaultSeats: 9 };
        }
        if (m.includes('n300') || m.includes('n400') || m.includes('promaster') || m.includes('vito')) {
            return { categories: ['SUV / Camioneta'], defaultCategory: 'SUV / Camioneta', maxSeats: 9, defaultSeats: 7 };
        }

        // 5. Modelos que vienen en Sedán Y Hatchback (HB) -> permiten elegir entre Sedán y Compacto
        const dualBodyModels = ['mazda 2', 'mazda 3', 'onix', 'rio', 'k3', 'yaris', 'corolla', 'grand i10', 'hb20', 'swift', 'polo', 'virtus', 'golf', 'jetta', 'fiesta', 'focus', 'city', 'civic', 'mirage', 'impreza', 'a3', 'clase a', 'serie 1', 'serie 2', 'leon', 'ibiza', 'cruze', 'joy', 'aveo', '208', 'c3', 'argo', 'cronos'];
        const hasHbTag = m.includes(' hb') || m.includes('hatchback') || m.includes('sportback') || m.includes('cross hb') || m.includes('stepway');
        const hasSedanTag = m.includes('sedan') || m.includes('dzire') || m.includes('gran coupe') || m.includes('virtus') || m.includes('voyage') || m.includes('logan') || m.includes('soluto');

        // Excepción: Corolla Cross es SUV
        if (m.includes('corolla cross') || m.includes('yaris cross') || m.includes('c3 aircross') || m.includes('c4 cactus')) {
            return { categories: ['SUV / Camioneta'], defaultCategory: 'SUV / Camioneta', maxSeats: explicitSeats || 5, defaultSeats: explicitSeats || 5 };
        }

        if (dualBodyModels.some(x => m.includes(x))) {
            if (hasHbTag && !hasSedanTag) {
                return { categories: ['Compacto', 'Sedán'], defaultCategory: 'Compacto', maxSeats: 5, defaultSeats: 5 };
            }
            if (hasSedanTag && !hasHbTag) {
                return { categories: ['Sedán', 'Compacto'], defaultCategory: 'Sedán', maxSeats: 5, defaultSeats: 5 };
            }
            // Si solo escribió "Mazda 3" o "Onix" sin especificar HB/Sedán, habilita ambas categorías!
            return { categories: ['Sedán', 'Compacto'], defaultCategory: 'Sedán', maxSeats: 5, defaultSeats: 5 };
        }

        // 6. Compactos estrictos (solo Hatchback / Citycar)
        if (m.includes('cooper 3') || m.includes('eq1')) {
            return { categories: ['Compacto'], defaultCategory: 'Compacto', maxSeats: 4, defaultSeats: 4 };
        }
        const onlyCompact = ['picanto', 'spark', 'beat', 'kwid', 'sandero', 'march', 'alto', 's-presso', 'celerio', 'baleno', 'ignis', 'i20', 'gol', 'mobi', '500', 'seagull', 'dolphin', 'mg 3', 'mg 4', 'e10x', 'ora 03', 'corsa', 'born', 'cooper', 'clubman', 'a1', 'leaf', 'i4'];
        if (onlyCompact.some(x => m.includes(x))) {
            return { categories: ['Compacto'], defaultCategory: 'Compacto', maxSeats: 5, defaultSeats: 5 };
        }

        // 7. Sedanes estrictos
        const onlySedan = ['logan', 'sail', 'mazda 6', 'prius', 'camry', 'soluto', 'cerato', 'forte', 'accent', 'elantra', 'sonata', 'ioniq 6', 'versa', 'sentra', 'altima', 'voyage', 'virtus', 'accord', 'seal', 'han', 'arrizo', 'mg 5', 'mg gt', 'alsvin', 'wrx', 'serie 3', 'serie 4', 'serie 5', 'cla', 'clase c', 'clase e', 'clase s', 'eqe', 'a4', 'a5', 'a6', 's60', 'model 3', 'model s', 'l07'];
        if (onlySedan.some(x => m.includes(x))) {
            return { categories: ['Sedán'], defaultCategory: 'Sedán', maxSeats: 5, defaultSeats: 5 };
        }

        // 8. SUVs de 7 plazas
        const suvs7 = ['fortuner', 'sw4', 'prado', 'land cruiser 300', '4runner', 'trailblazer', 'captiva', 'cx-9', 'cx-90', 'sorento', 'pathfinder', 'xl7', 'ertiga', 'teramont', 'explorer', 'pilot', 'montero sport', 'commander', '5008', 'tiggo 8', 'js8', 'tang', 'evoltis', 'x7', 'gls', 'q7', 'xc90', 'defender 110', 'discovery', 'durango', 'x70', 'x90', 'okavango', '009', 'model x', 'rexton', 'tarraco', 'glb', 'eqb', 'tiguan', 'x-trail', 'creta grand', 'santa fe', 'ev9', 'c3 aircross', 'jaecoo 8'];
        if (suvs7.some(x => m.includes(x))) {
            const maxS = explicitSeats || 7;
            return { categories: ['SUV / Camioneta'], defaultCategory: 'SUV / Camioneta', maxSeats: maxS, defaultSeats: maxS };
        }

        // 9. SUVs estándar (4 o 5 plazas)
        if (m.includes('jimny')) {
            return { categories: ['SUV / Camioneta'], defaultCategory: 'SUV / Camioneta', maxSeats: 4, defaultSeats: 4 };
        }
        const suvs5 = ['duster', 'koleos', 'captur', 'arkana', 'kardian', 'tracker', 'equinox', 'blazer', 'cx-3', 'cx-30', 'cx-5', 'cx-50', 'cx-60', 'raize', 'rush', 'rav4', 'sonet', 'seltos', 'stonic', 'niro', 'sportage', 'ev5', 'ev6', 'venue', 'creta', 'kona', 'tucson', 'ioniq 5', 'kicks', 'qashqai', 'murano', 'patrol', 'vitara', 'grand vitara', 's-cross', 'fronx', 'nivus', 't-cross', 'taos', 'touareg', 'id.4', 'ecosport', 'escape', 'bronco', 'edge', 'wr-v', 'hr-v', 'zr-v', 'cr-v', 'passport', 'asx', 'eclipse cross', 'outlander', 'renegade', 'compass', 'cherokee', 'grand cherokee', 'wrangler', '2008', '3008', 'cactus', 'pulse', 'fastback', 'yuan', 'atto 3', 'song', 'tiggo', 'mg zs', 'mg hs', 'mg rx5', 'mg one', 'js2', 'js3', 'js4', 'js6', 'cs15', 'cs35', 'cs55', 'uni-t', 'uni-k', 'jolion', 'h6', 'dargo', 'tivoli', 'korando', 'torres', 'actyon', 'crosstrek', 'xv', 'forester', 'outback', 'x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'ix1', 'ix3', 'gla', 'glc', 'gle', 'clase g', 'eqa', 'q2', 'q3', 'q5', 'q8', 'e-tron', 'ex30', 'xc40', 'ex40', 'c40', 'xc60', 'evoque', 'velar', 'range rover', 'macan', 'cayenne', 'countryman', 'aceman', 'arona', 'ateca', 'formentor', 'terramar', 'mokka', 'crossland', 'grandland', 'journey', 'dashing', 't2', 'coolray', 'azkarra', 'geometry', 'ex5', 's07', 's05', '001', '7x', 'omoda', 'jaecoo', 'model y', 'kangoo', 'partner', 'berlingo', 'fiorino'];
        if (suvs5.some(x => m.includes(x))) {
            return { categories: ['SUV / Camioneta'], defaultCategory: 'SUV / Camioneta', maxSeats: explicitSeats || 5, defaultSeats: explicitSeats || 5 };
        }

        if (b && m === 'x') return { categories: ['SUV / Camioneta'], defaultCategory: 'SUV / Camioneta', maxSeats: 5, defaultSeats: 5 };
        return null;
    }

    function getLuggageByCategory(cat) {
        const c = normText(cat);
        if (c.includes('pickup')) return 5;
        if (c.includes('suv') || c.includes('camioneta')) return 4;
        if (c.includes('sedan')) return 3;
        if (c.includes('compacto')) return 2;
        if (c.includes('deportivo')) return 2;
        return 3;
    }

    window.CAR_CATALOG_BY_BRAND = CAR_CATALOG_BY_BRAND;
    window.getLuggageByCategory = getLuggageByCategory;
    window.detectVehicleSpecs = function (brand, model) {
        const res = detectVehicleSpecs(brand, model);
        if (!res) return null;
        return Object.assign({}, res, { luggage: getLuggageByCategory(res.defaultCategory) });
    };
})();
