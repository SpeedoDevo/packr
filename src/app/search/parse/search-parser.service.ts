import { Injectable } from '@angular/core';
import { attempt } from 'lodash';
import { Parser } from 'nearley';
import { SearchTerm } from './search.grammar';
import { ParserRules, ParserStart } from './search.grammar.ne';

@Injectable()
export class SearchParserService {
  parser = new Parser(ParserRules, ParserStart);

  constructor() {
    this.parser.options.keepHistory = true;
  }

  parse(input: string): SearchTerm[] {
    attempt(() => this.parser.feed(input));
    const res = this.parser.results[0] || null;
    this.parser.rewind(0);
    return res;
  }
}
