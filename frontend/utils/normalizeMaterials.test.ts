import normalizeMaterials from './normalizeMaterials';

describe('normalizeMaterials', () => {
  test('normalizes object sizeValue with explicit fields', () => {
    const materials: any = [
      {
        id: 'm1',
        name: 'Mat1',
        components: [
          { id: 'c1', name: 'Comp1', sizeValue: { lengthValue: 10, lengthUnit: 'mm' } }
        ]
      }
    ];

    const out = normalizeMaterials(materials);
    expect(out[0].components[0].lengthValue).toBe(10);
    expect(out[0].components[0].lengthUnit).toBe('mm');
  });

  test('parses JSON-string sizeValue', () => {
    const materials: any = [
      {
        id: 'm2',
        name: 'Mat2',
        components: [
          { id: 'c2', name: 'Comp2', sizeValue: JSON.stringify({ length: '20mm' }) }
        ]
      }
    ];

    const out = normalizeMaterials(materials);
    expect(out[0].components[0].lengthValue).toBe(20);
  });

  test('handles array sizeValue', () => {
    const materials: any = [
      {
        id: 'm3',
        name: 'Mat3',
        components: [
          { id: 'c3', name: 'Comp3', sizeValue: [{ lengthValue: '5cm' }] }
        ]
      }
    ];

    const out = normalizeMaterials(materials);
    // '5cm' -> pickNumber should parse to 5
    expect(out[0].components[0].lengthValue).toBe(5);
  });

  test('flattens nested dimensions', () => {
    const materials: any = [
      {
        id: 'm4',
        name: 'Mat4',
        components: [
          { id: 'c4', name: 'Comp4', sizeValue: { dimensions: { length: '3' } } }
        ]
      }
    ];

    const out = normalizeMaterials(materials);
    expect(out[0].components[0].lengthValue).toBe(3);
  });

  test('produces rawSizeString for unknown objects', () => {
    const materials: any = [
      {
        id: 'm5',
        name: 'Mat5',
        components: [
          { id: 'c5', name: 'Comp5', sizeValue: { foo: 'bar' } }
        ]
      }
    ];

    const out = normalizeMaterials(materials);
    const comp = out[0].components[0] as any;
    expect(typeof comp.rawSizeString).toBe('string');
    expect(comp.rawSizeString.length).toBeGreaterThan(0);
  });
});
