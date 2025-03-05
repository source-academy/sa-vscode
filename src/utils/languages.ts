import { Chapter } from "js-slang/dist/types";

const SECTION = "\u00A7";

/**
 * Basically a subset of js-slang's Chapter
 */
export const LANGUAGES = {
  SOURCE_1: `Source ${SECTION}1`,
  SOURCE_2: `Source ${SECTION}2`,
  SOURCE_3: `Source ${SECTION}3`,
  SOURCE_4: `Source ${SECTION}4`,
};

export function languageToChapter(
  language: (typeof LANGUAGES)[keyof typeof LANGUAGES],
): Chapter {
  if (language === LANGUAGES.SOURCE_1) {
    return Chapter.SOURCE_1;
  }
  if (language === LANGUAGES.SOURCE_2) {
    return Chapter.SOURCE_2;
  }
  if (language === LANGUAGES.SOURCE_3) {
    return Chapter.SOURCE_3;
  }
  if (language === LANGUAGES.SOURCE_4) {
    return Chapter.SOURCE_4;
  }
  throw Error("Language not allowed!");
}
