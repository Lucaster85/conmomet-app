## ¿Qué es "Datos de mi empresa"?

Es la pantalla donde se cargan los datos de **quien factura**: la empresa. Se ubica en **Configuración → Datos de mi empresa** y la ve quien tiene el permiso de **configuración de la empresa**.

Estos datos se usan para **emitir facturas desde la app contra ARCA** (próximas etapas) y salen impresos en el PDF de cada factura. **Hoy todavía no se emite nada desde acá**: las facturas se siguen cargando a mano en Facturación. Esta pantalla deja todo listo y permite **probar la conexión con ARCA**.

> Al emitir una factura, los datos de la empresa **se guardan junto con ella**. Si después cambiás el domicilio o la razón social, las facturas ya emitidas **no cambian**.

## Emisor de las facturas

- **Razón social** y **nombre para el encabezado**.
- **CUIT** (se valida el dígito verificador), **condición frente al IVA**, **número de Ingresos Brutos** e **inicio de actividades**.
- **Domicilio comercial**: calle, número, localidad y provincia.
- **Email** y **teléfono** de contacto.
- **Opción de transferencia de la FCE** por defecto (ver más abajo).

## Puntos de venta

Los **puntos de venta los da de alta la empresa en ARCA**, no la app. Acá solo se cargan para poder elegirlos al facturar.

- **Número**: tal como figura en ARCA (por ejemplo, 3 para el 00003).
- **Para qué se usa**: una descripción corta, por ejemplo "Obras con IIBB" o "Construcción sin IIBB". Se muestra al elegir el punto de venta, para no equivocarse. La app **no calcula Ingresos Brutos**: la separación entre puntos de venta es solo contable.
- **Tipo**:
  - **Web service**: ARCA lo habilita para emitir por sistema. Son los únicos que la app va a ofrecer al emitir.
  - **Comprobantes en línea**: los de la web de ARCA. **No se pueden usar desde la app**, pero sí sirven para **cargar a mano** facturas que se hicieron en la web.
- **Predeterminado** y **Activo**. Un punto inactivo no puede ser el predeterminado.

> Los puntos de venta que hoy usa la empresa (0001 y 0002) son de "Comprobantes en línea". Para emitir desde la app hay que **crear en ARCA puntos de venta nuevos de tipo web services** (por ejemplo, el 0003 y el 0004), con su numeración propia.

**Validar con ARCA** compara los puntos de venta de tipo web service cargados acá con los que ARCA tiene habilitados. En **homologación** (el ambiente de pruebas) ARCA no tiene puntos dados de alta, así que ahí **solo avisa y no bloquea**: se puede cargar cualquier número para probar.

Un punto de venta **no se puede eliminar si ya tiene facturas**: en ese caso se **desactiva**.

## Cuentas bancarias

Banco, **CBU** (22 dígitos; la app comprueba que sea válido y avisa si hay un error de tipeo), **alias** y moneda (opcional). Se elige una **al facturar**, y viene precargada la **predeterminada**. El CBU y el alias se **imprimen en la factura** y, en la **Factura de Crédito Electrónica (FCE)**, se informan a ARCA.

## Opción de transferencia de la FCE

La FCE exige indicar cómo se transfiere: **SCA** (sistema de circulación abierta) o **ADC** (agente de depósito colectivo). Acá se define la opción **por defecto de la empresa**. Algunos clientes piden una en particular (por ejemplo, ADC): cada cliente podrá tener la suya.

## Conexión con ARCA

La tarjeta **Conexión con ARCA** muestra lo que tiene cargado el servidor:

- El **ambiente**, bien visible: **Homologación** (pruebas, las facturas **no tienen validez fiscal**) o **Producción**. Si dice **Apagada**, la integración no está activa en ese servidor.
- El **CUIT emisor** y el **certificado** (a nombre de quién está y cuándo **vence**). Si vence en menos de 30 días se muestra un aviso: si el certificado vence y nadie lo renueva, **la emisión se corta sin aviso**.
- Si el CUIT de la conexión **no coincide** con el de los datos de la empresa. En homologación es normal (se prueba con otro CUIT); en **producción no se puede emitir** así.

El certificado, la clave y el ambiente **no se cargan desde esta pantalla**: los configura quien administra el servidor, y se reemplazan con un nuevo despliegue.

**Probar conexión** hace una verificación completa y muestra cada paso:

1. **Servidores de ARCA**: si están funcionando.
2. **Inicio de sesión**: si el certificado es aceptado. ARCA entrega un ticket que dura 12 horas y la app lo **reutiliza**: probar varias veces seguidas no pide un ticket nuevo cada vez.
3. **Puntos de venta** habilitados en ARCA.
4. **Último comprobante autorizado** de cada punto de venta de tipo web service (para Factura A y para FCE).
5. **Cotización del dólar** según ARCA.

Si un paso falla, los demás se muestran igual, con el motivo en lenguaje claro.

> **Un mismo certificado en dos lugares.** ARCA solo da un ticket por certificado a la vez. Si el mismo certificado de pruebas se usa en dos servidores (por ejemplo, el de pruebas y una computadora de desarrollo), el segundo que intente conectarse ve el mensaje "ARCA ya tiene un ticket de acceso vigente". Se resuelve esperando a que venza (hasta 12 horas) o usando un certificado distinto en cada lugar.

## Si ARCA no funciona

Si ARCA está caído o la conexión falla, **la facturación no se frena**: se puede emitir la factura desde la **web de ARCA**, con un punto de venta de "Comprobantes en línea", y **cargarla a mano** en Facturación como hasta ahora.

## Quién puede hacer qué

Todo lo de esta pantalla (ver, editar y probar la conexión) requiere un **único permiso**: **configuración de la empresa**. Cada cambio queda registrado con quién lo hizo.

<!-- ref: conmomet-app/src/app/dashboard/company-settings/page.tsx, conmomet-app/src/components/company/ArcaConnectionCard.tsx, conmomet-app/src/components/company/CompanyProfileCard.tsx, conmomet-app/src/components/company/PointsOfSaleCard.tsx, conmomet-app/src/components/company/BankAccountsCard.tsx, api_conmomet/controllers/companySettingsController.js, api_conmomet/services/arca/index.js, api_conmomet/services/arca/wsaa.js, api_conmomet/services/arca/wsfe.js, api_conmomet/helpers/cbu.js -->
