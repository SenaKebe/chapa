export const DEFAULT_PRODUCT_ATTRIBUTES: Record<string, { name: string }[]> = {
  Electronics: [
    { name: 'Brand' },
    { name: 'Model' },
    { name: 'Storage' },
    { name: 'RAM' },
    { name: 'Condition' },
  ],
  Vehicles: [
    { name: 'Brand' },
    { name: 'Model' },
    { name: 'Year' },
    { name: 'Fuel Type' },
    { name: 'Transmission' },
  ],
  RealEstate: [
    { name: 'Type' },
    { name: 'Bedrooms' },
    { name: 'Bathrooms' },
    { name: 'Size (sqm)' },
    { name: 'Price per sqm' },
  ],
  Fashion: [
    { name: 'Size' },
    { name: 'Color' },
    { name: 'Material' },
    { name: 'Gender' },
  ],
};
