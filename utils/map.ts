export enum LocationTypeEnum {
  CAMPING_AREA = 'CAMPING_AREA',
  FIREPLACE = 'FIREPLACE',
  LAAVU = 'LAAVU',
  TOILET = 'TOILET',
  BEACH = 'BEACH',
  BRIDGE = 'BRIDGE',
  PARKING = 'PARKING',
  OTHER = 'OTHER',
}

export function getIconName(
  type: string
):
  | 'tent'
  | 'campfire'
  | 'waves'
  | 'bridge'
  | 'chevron-up-box-outline'
  | 'toilet'
  | 'parking'
  | 'map-marker-question' {
  switch (type) {
    case LocationTypeEnum.CAMPING_AREA:
      return 'tent';
    case LocationTypeEnum.FIREPLACE:
      return 'campfire';
    case LocationTypeEnum.BEACH:
      return 'waves';
    case LocationTypeEnum.BRIDGE:
      return 'bridge';
    case LocationTypeEnum.LAAVU:
      return 'chevron-up-box-outline';
    case LocationTypeEnum.TOILET:
      return 'toilet';
    case LocationTypeEnum.PARKING:
      return 'parking';
    case LocationTypeEnum.OTHER:
    default:
      return 'map-marker-question';
  }
}
