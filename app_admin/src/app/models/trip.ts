export class Trip {
  _id?: string;
  code: string;
  name: string;
  length: number;
  start: string;
  resort: string;
  perPerson: number;
  image: string;
  description: string;

  constructor(
    code: string,
    name: string,
    length: number,
    start: string,
    resort: string,
    perPerson: number,
    image: string,
    description: string,
    _id?: string
  ) {
    this._id = _id;
    this.code = code;
    this.name = name;
    this.length = length;
    this.start = start;
    this.resort = resort;
    this.perPerson = perPerson;
    this.image = image;
    this.description = description;
  }
}