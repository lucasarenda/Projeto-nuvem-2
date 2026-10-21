import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ApiService, errosDeCampo, mensagemErro } from '../../core/api.service';
import { FeedbackService } from '../../core/feedback.service';
import { CIDADES, localizacaoAtual } from '../../core/geo';
import { OngForm, UFS } from '../../core/models';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-ong-form',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container page" style="max-width: 880px">
      <a [routerLink]="id() ? ['/ongs', id()] : ['/ongs']" class="link-seta small mb-2" style="display:inline-flex">
        <app-icon nome="seta-esq" [tamanho]="15" /> Voltar
      </a>
      <header class="page-header">
        <div>
          <span class="eyebrow"><app-icon nome="predio" [tamanho]="14" /> {{ id() ? 'Editar' : 'Nova' }} instituição</span>
          <h1>{{ id() ? 'Editar dados da ONG' : 'Cadastre sua ONG' }}</h1>
          <p>As informações aparecem para os doadores. A localização define a distância no match.</p>
        </div>
      </header>

      <form class="card card-lg" [formGroup]="form" (ngSubmit)="salvar()" novalidate>
        <h3>Identificação</h3>
        <div class="form-grid">
          <div class="field col-4">
            <label for="nome">Nome da instituição *</label>
            <input id="nome" class="input" formControlName="nome" placeholder="Ex.: Instituto Mãos que Alimentam" />
            @if (erro('nome'); as e) { <span class="erro">{{ e }}</span> }
          </div>
          <div class="field col-2">
            <label for="cnpj">CNPJ</label>
            <input id="cnpj" class="input" formControlName="cnpj" placeholder="00.000.000/0000-00" (input)="mascararCnpj()" maxlength="18" />
            @if (erro('cnpj'); as e) { <span class="erro">{{ e }}</span> }
          </div>
          <div class="field col-3">
            <label for="email">E-mail *</label>
            <input id="email" class="input" type="email" formControlName="email" />
            @if (erro('email'); as e) { <span class="erro">{{ e }}</span> }
          </div>
          <div class="field col-3">
            <label for="tel">Telefone</label>
            <input id="tel" class="input" formControlName="telefone" placeholder="(11) 3000-0000" />
          </div>
          <div class="field col-6">
            <label for="desc">Sobre a ONG</label>
            <textarea id="desc" class="textarea" formControlName="descricao" maxlength="2000"
                      placeholder="Quem vocês atendem, como os itens são usados…"></textarea>
          </div>
        </div>

        <hr class="divider" />
        <div class="row-between mb-2">
          <h3 class="mb-0">Endereço e localização</h3>
          <button type="button" class="btn btn-sm" (click)="usarLocalizacao()" [disabled]="localizando()">
            @if (localizando()) { <span class="spinner"></span> } @else { <app-icon nome="localizar" [tamanho]="15" /> }
            Usar minha localização
          </button>
        </div>
        <div class="form-grid">
          <div class="field col-6">
            <label for="end">Endereço</label>
            <input id="end" class="input" formControlName="endereco" placeholder="Rua, número - bairro" />
          </div>
          <div class="field col-4">
            <label for="cidade">Cidade *</label>
            <input id="cidade" class="input" formControlName="cidade" list="cidades" (change)="cidadeEscolhida()" />
            <datalist id="cidades">
              @for (c of cidades; track c.nome) { <option [value]="c.nome">{{ c.uf }}</option> }
            </datalist>
            <span class="hint">Escolher uma cidade da lista preenche UF e coordenadas.</span>
            @if (erro('cidade'); as e) { <span class="erro">{{ e }}</span> }
          </div>
          <div class="field col-2">
            <label for="uf">UF *</label>
            <select id="uf" class="select" formControlName="uf">
              <option value="" disabled>UF</option>
              @for (u of ufs; track u) { <option [value]="u">{{ u }}</option> }
            </select>
            @if (erro('uf'); as e) { <span class="erro">{{ e }}</span> }
          </div>
          <div class="field col-3">
            <label for="lat">Latitude *</label>
            <input id="lat" class="input" type="number" step="0.0001" formControlName="latitude" />
            @if (erro('latitude'); as e) { <span class="erro">{{ e }}</span> }
          </div>
          <div class="field col-3">
            <label for="lng">Longitude *</label>
            <input id="lng" class="input" type="number" step="0.0001" formControlName="longitude" />
            @if (erro('longitude'); as e) { <span class="erro">{{ e }}</span> }
          </div>
        </div>

        <div class="form-actions">
          <a class="btn btn-ghost" [routerLink]="id() ? ['/ongs', id()] : ['/ongs']">Cancelar</a>
          <button class="btn btn-primary" type="submit" [disabled]="salvando()">
            @if (salvando()) { <span class="spinner"></span> } @else { <app-icon nome="check" [tamanho]="18" /> }
            {{ id() ? 'Salvar alterações' : 'Cadastrar ONG' }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class OngFormPage implements OnInit {
  readonly id = input<string | undefined>();

  private readonly api = inject(ApiService);
  private readonly fb = inject(FeedbackService);
  private readonly router = inject(Router);

  protected readonly ufs = UFS;
  protected readonly cidades = CIDADES;
  protected readonly salvando = signal(false);
  protected readonly localizando = signal(false);
  private readonly errosServidor = signal<Record<string, string>>({});

  protected readonly form = inject(NonNullableFormBuilder).group({
    nome: ['', [Validators.required, Validators.maxLength(150)]],
    cnpj: ['', Validators.pattern(/^$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)],
    email: ['', [Validators.required, Validators.email]],
    telefone: [''],
    descricao: [''],
    endereco: [''],
    cidade: ['', Validators.required],
    uf: ['', Validators.required],
    latitude: [null as number | null, [Validators.required, Validators.min(-90), Validators.max(90)]],
    longitude: [null as number | null, [Validators.required, Validators.min(-180), Validators.max(180)]],
  });

  ngOnInit(): void {
    const id = Number(this.id());
    if (id) {
      this.api.ong(id).subscribe({
        next: (o) => this.form.patchValue({ ...o, cnpj: o.cnpj ?? '', telefone: o.telefone ?? '', descricao: o.descricao ?? '', endereco: o.endereco ?? '' }),
        error: (e) => this.fb.erro(mensagemErro(e)),
      });
    }
  }

  protected erro(campo: keyof typeof this.form.controls): string | null {
    const c = this.form.controls[campo];
    const servidor = this.errosServidor()[campo];
    if (servidor) return servidor;
    if (!c.touched || c.valid) return null;
    if (c.hasError('required')) return 'Campo obrigatório';
    if (c.hasError('email')) return 'E-mail inválido';
    if (c.hasError('pattern')) return 'Formato 00.000.000/0000-00';
    if (c.hasError('min') || c.hasError('max')) return 'Coordenada fora do intervalo';
    return 'Valor inválido';
  }

  protected mascararCnpj(): void {
    const d = this.form.controls.cnpj.value.replace(/\D/g, '').slice(0, 14);
    const m = d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
    this.form.controls.cnpj.setValue(m, { emitEvent: false });
  }

  protected cidadeEscolhida(): void {
    const c = CIDADES.find((x) => x.nome.toLowerCase() === this.form.controls.cidade.value.trim().toLowerCase());
    if (c) this.form.patchValue({ cidade: c.nome, uf: c.uf, latitude: c.lat, longitude: c.lng });
  }

  protected async usarLocalizacao(): Promise<void> {
    this.localizando.set(true);
    try {
      const { lat, lng } = await localizacaoAtual();
      this.form.patchValue({ latitude: lat, longitude: lng });
    } catch (e) {
      this.fb.erro((e as Error).message);
    } finally {
      this.localizando.set(false);
    }
  }

  protected salvar(): void {
    this.errosServidor.set({});
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.fb.erro('Revise os campos destacados.');
      return;
    }
    this.salvando.set(true);
    const id = Number(this.id()) || undefined;
    this.api.salvarOng(this.form.getRawValue() as OngForm, id).subscribe({
      next: (o) => {
        this.fb.sucesso(id ? 'ONG atualizada.' : 'ONG cadastrada! Agora publique as necessidades.');
        this.router.navigate(['/ongs', o.id]);
      },
      error: (e) => {
        this.salvando.set(false);
        this.errosServidor.set(errosDeCampo(e));
        this.fb.erro(mensagemErro(e));
      },
    });
  }
}
