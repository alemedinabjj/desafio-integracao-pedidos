import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1790191355262 implements MigrationInterface {
  name = 'InitialSchema1790191355262';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "exames" ("accession_number" character varying(64) NOT NULL, "nome_paciente" character varying(200) NOT NULL, "modalidade" character varying(16) NOT NULL, "status" character varying(32) NOT NULL, "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a1cfb1c975696bab4569eeea4d0" PRIMARY KEY ("accession_number"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "documentos" ("id" SERIAL NOT NULL, "codigo_documento" integer NOT NULL, "codigo_pedido" integer NOT NULL, "nome_documento" character varying(200) NOT NULL, "conteudo" text NOT NULL, "integrado" boolean NOT NULL DEFAULT false, "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_documento_pedido" UNIQUE ("codigo_documento", "codigo_pedido"), CONSTRAINT "PK_30b7ee230a352e7582842d1dc02" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_documentos_codigo_pedido" ON "documentos"  ("codigo_pedido") `,
    );
    await queryRunner.query(
      `CREATE TABLE "documentos_exames" ("documento_id" integer NOT NULL, "accession_number" character varying(64) NOT NULL, "vinculado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_52fb44581ff80d15f7d6e97a7ee" PRIMARY KEY ("documento_id", "accession_number"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "pedidos" ("codigo_pedido" integer NOT NULL, "nome_paciente" character varying(200) NOT NULL, "data_nascimento" character(8) NOT NULL, "sexo" character(1) NOT NULL, "cod_unidade" integer NOT NULL, "integrado" boolean NOT NULL DEFAULT false, "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_9e883b7091bccb94f2cb1003309" PRIMARY KEY ("codigo_pedido"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "itens_pedido" ("id" SERIAL NOT NULL, "codigo_pedido" integer NOT NULL, "codigo_item_pedido" integer NOT NULL, "accession_number" character varying(64) NOT NULL, "modalidade" character varying(16) NOT NULL, "nome_procedimento" character varying(200) NOT NULL, "integrado" boolean NOT NULL DEFAULT false, "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_item_pedido" UNIQUE ("codigo_pedido", "codigo_item_pedido"), CONSTRAINT "PK_34ba752329a604381e367c431ff" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_itens_pedido_accession_number" ON "itens_pedido"  ("accession_number") `,
    );
    await queryRunner.query(
      `ALTER TABLE "documentos_exames" ADD CONSTRAINT "FK_cb21b0f87f9c7b954cf04d1f634" FOREIGN KEY ("documento_id") REFERENCES "documentos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "documentos_exames" ADD CONSTRAINT "FK_6db4ae632fa9dbab57f4d3f45fa" FOREIGN KEY ("accession_number") REFERENCES "exames"("accession_number") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "itens_pedido" ADD CONSTRAINT "FK_bdd1e055b83f2c21e0aa55afda1" FOREIGN KEY ("codigo_pedido") REFERENCES "pedidos"("codigo_pedido") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "itens_pedido" DROP CONSTRAINT "FK_bdd1e055b83f2c21e0aa55afda1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documentos_exames" DROP CONSTRAINT "FK_6db4ae632fa9dbab57f4d3f45fa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documentos_exames" DROP CONSTRAINT "FK_cb21b0f87f9c7b954cf04d1f634"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_itens_pedido_accession_number"`,
    );
    await queryRunner.query(`DROP TABLE "itens_pedido"`);
    await queryRunner.query(`DROP TABLE "pedidos"`);
    await queryRunner.query(`DROP TABLE "documentos_exames"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_documentos_codigo_pedido"`,
    );
    await queryRunner.query(`DROP TABLE "documentos"`);
    await queryRunner.query(`DROP TABLE "exames"`);
  }
}
