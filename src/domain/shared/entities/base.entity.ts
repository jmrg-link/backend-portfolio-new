/**
 * Base abstracta de las entidades de dominio: estado inmutable recibido
 * por constructor y doble forma de salida.
 *
 * @remarks
 * `toEntity` entrega una copia superficial (respuestas y serialización);
 * las entidades con arrays la sobrescriben para copiar también sus
 * colecciones. `toEntityMap` sirve updates parciales, caché y diffing. El
 * cast de Object.entries está justificado: las claves de `props` son por
 * construcción `keyof TProps`, información que entries pierde al tiparlas
 * como string.
 */
export abstract class BaseEntity<TProps extends object> {
  public constructor(protected readonly props: TProps) {}

  public toEntity(): TProps {
    return { ...this.props };
  }

  public toEntityMap(): Map<keyof TProps, unknown> {
    return new Map(Object.entries(this.props) as [keyof TProps, unknown][]);
  }
}
