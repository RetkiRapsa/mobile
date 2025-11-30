export enum SpotTypeEnum {
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
    case SpotTypeEnum.CAMPING_AREA:
      return 'tent';
    case SpotTypeEnum.FIREPLACE:
      return 'campfire';
    case SpotTypeEnum.BEACH:
      return 'waves';
    case SpotTypeEnum.BRIDGE:
      return 'bridge';
    case SpotTypeEnum.LAAVU:
      return 'chevron-up-box-outline';
    case SpotTypeEnum.TOILET:
      return 'toilet';
    case SpotTypeEnum.PARKING:
      return 'parking';
    case SpotTypeEnum.OTHER:
    default:
      return 'map-marker-question';
  }
}
