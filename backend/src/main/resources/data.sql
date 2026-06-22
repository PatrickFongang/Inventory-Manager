MERGE INTO section (id, name, sort_order) KEY(id) VALUES (1, 'Mrożonka', 1);
MERGE INTO section (id, name, sort_order) KEY(id) VALUES (2, 'Art. Spożywcze', 2);
MERGE INTO section (id, name, sort_order) KEY(id) VALUES (3, 'Snacki', 3);
MERGE INTO section (id, name, sort_order) KEY(id) VALUES (4, 'Napoje', 4);
MERGE INTO section (id, name, sort_order) KEY(id) VALUES (5, 'Napoje gorące', 5);
MERGE INTO section (id, name, sort_order) KEY(id) VALUES (6, 'Piwo', 6);
MERGE INTO section (id, name, sort_order) KEY(id) VALUES (7, 'Op. jednorazowe', 7);
MERGE INTO section (id, name, sort_order) KEY(id) VALUES (8, 'Szafka koordynatora', 8);
MERGE INTO section (id, name, sort_order) KEY(id) VALUES (9, 'Ubrania', 9);

ALTER TABLE section ALTER COLUMN id RESTART WITH 10;

MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (1, 'ZAPIEKANKA (SZT)', 'Mrożonka', 1);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (2, 'BUŁKA HD (SZT)', 'Mrożonka', 2);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (3, 'PARÓWKA (KG)', 'Mrożonka', 3);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (4, 'FRYTKI (KG)', 'Mrożonka', 4);

MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (5, 'KETCHUP (SZT)', 'Art. Spożywcze', 5);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (6, 'MUSZTARDA (SZT)', 'Art. Spożywcze', 6);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (7, 'CEBULKA kg (KG)', 'Art. Spożywcze', 7);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (8, 'SALSA BTL 0,85KG (KG)', 'Art. Spożywcze', 8);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (9, 'SÓL STIX (SZT)', 'Art. Spożywcze', 9);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (10, 'FRYTURA (L)', 'Art. Spożywcze', 10);

MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (11, 'POPCORN worek (SZT)', 'Snacki', 11);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (12, 'Nachos op (SZT)', 'Snacki', 12);

MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (13, 'Coca cola (SZT)', 'Napoje', 13);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (14, 'coca cola zero (SZT)', 'Napoje', 14);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (15, 'coca cola zero zero (SZT)', 'Napoje', 15);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (16, 'fanta zero (SZT)', 'Napoje', 16);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (17, 'Sprite zero (SZT)', 'Napoje', 17);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (18, 'Fuzetea (SZT)', 'Napoje', 18);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (19, 'CAPPY LEMONADE (SZT)', 'Napoje', 19);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (20, 'WODA N/G (SZT)', 'Napoje', 20);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (21, 'WODA GAZ (SZT)', 'Napoje', 21);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (22, 'RED BULL (SZT)', 'Napoje', 22);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (23, 'RED BULL ZERO (SZT)', 'Napoje', 23);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (24, 'WODA PRACOWNICZA (SZT)', 'Napoje', 24);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (25, 'Nosidełka na napoje (SZT)', 'Napoje', 25);

MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (26, 'KAWA (SZT)', 'Napoje gorące', 26);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (27, 'HERBATA (SZT)', 'Napoje gorące', 27);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (28, 'CUKIER (SZT)', 'Napoje gorące', 28);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (29, 'ŚMIETANKA (SZT)', 'Napoje gorące', 29);

MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (30, 'TYSKIE 3,5% KEG (L)', 'Piwo', 30);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (31, 'TYSKIE 0% (SZT)', 'Piwo', 31);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (32, 'SOK PIWO op. 2,85 (L)', 'Piwo', 32);

MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (33, 'TACKA ZAPIEKANKA* (SZT)', 'Op. jednorazowe', 33);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (34, 'OP. HOTDOG (SZT)', 'Op. jednorazowe', 34);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (35, 'OP. FRYTKI (SZT)', 'Op. jednorazowe', 35);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (36, 'KUBEK TYSKIE 0,4L (SZT)', 'Op. jednorazowe', 36);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (37, 'KUBEK CZERWONY 0,4L (SZT)', 'Op. jednorazowe', 37);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (38, 'KUBEK cola (SZT)', 'Op. jednorazowe', 38);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (39, 'KUBEK 0,5L (SZT)', 'Op. jednorazowe', 39);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (40, 'KUBEK 0,3L (SZT)', 'Op. jednorazowe', 40);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (41, 'KUBEK RED BULL (SZT)', 'Op. jednorazowe', 41);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (42, 'WIECZKO 0,3L (SZT)', 'Op. jednorazowe', 42);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (43, 'MIESZADEŁKO (SZT)', 'Op. jednorazowe', 43);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (44, 'OP. NACHOS (SZT)', 'Op. jednorazowe', 44);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (45, 'OP.POPCORN (SZT)', 'Op. jednorazowe', 45);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (46, 'NOSIDEŁKA ZGREWKA (SZT)', 'Op. jednorazowe', 46);

MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (47, 'Łopatka do popcornu (SZT)', 'Szafka koordynatora', 47);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (48, 'Nóż (SZT)', 'Szafka koordynatora', 48);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (49, 'Szczypce (SZT)', 'Szafka koordynatora', 49);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (50, 'Rękawice do pieca (SZT)', 'Szafka koordynatora', 50);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (51, 'Gąbki (SZT)', 'Szafka koordynatora', 51);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (52, 'Spryskiwacz (SZT)', 'Szafka koordynatora', 52);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (53, 'Kubełek na wode (SZT)', 'Szafka koordynatora', 53);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (54, 'Rolki do terminala (SZT)', 'Szafka koordynatora', 54);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (55, 'Rolki do drukarek fiskalnych (SZT)', 'Szafka koordynatora', 55);

MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (56, 'Polar (SZT)', 'Ubrania', 56);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (57, 'T-shirt (SZT)', 'Ubrania', 57);
MERGE INTO product (id, name, section_name, sort_order) KEY(id) VALUES (58, 'Polo (SZT)', 'Ubrania', 58);
