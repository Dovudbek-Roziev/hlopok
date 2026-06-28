export interface ColorOption {
  hex: string;
  ru: string;
  ky: string;
}

export const PRESET_COLORS: ColorOption[] = [
  { hex: '#FFFFFF', ru: 'Белый',        ky: 'Ак'           },
  { hex: '#F5F5F5', ru: 'Светло-серый', ky: 'Ачык боз'     },
  { hex: '#9E9E9E', ru: 'Серый',        ky: 'Боз'          },
  { hex: '#1A1A1A', ru: 'Чёрный',       ky: 'Кара'         },
  { hex: '#E53935', ru: 'Красный',      ky: 'Кызыл'        },
  { hex: '#FF8A65', ru: 'Коралловый',   ky: 'Мержан'       },
  { hex: '#FF9800', ru: 'Оранжевый',    ky: 'Кызгылт-сары' },
  { hex: '#FFD700', ru: 'Жёлтый',       ky: 'Сары'         },
  { hex: '#4CAF50', ru: 'Зелёный',      ky: 'Жашыл'        },
  { hex: '#00BCD4', ru: 'Бирюзовый',    ky: 'Бирюза'       },
  { hex: '#2196F3', ru: 'Синий',        ky: 'Көк'          },
  { hex: '#03A9F4', ru: 'Голубой',      ky: 'Ачык-көк'     },
  { hex: '#9C27B0', ru: 'Фиолетовый',   ky: 'Кок-кызыл'   },
  { hex: '#E91E63', ru: 'Розовый',      ky: 'Кызгылт'      },
  { hex: '#F8BBD9', ru: 'Светло-розовый', ky: 'Ачык кызгылт' },
  { hex: '#795548', ru: 'Коричневый',   ky: 'Күрөң'        },
  { hex: '#D7CCC8', ru: 'Бежевый',      ky: 'Беж'          },
  { hex: '#B2DFDB', ru: 'Мятный',       ky: 'Жалбыз'       },
];

export const colorName = (hex: string, lang: 'ru' | 'ky' = 'ru'): string => {
  const found = PRESET_COLORS.find(c => c.hex.toLowerCase() === hex?.toLowerCase());
  return found ? found[lang] : hex;
};
