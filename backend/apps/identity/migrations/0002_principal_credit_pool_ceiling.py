from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("identity", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="principal",
            name="credit_pool_ceiling",
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal("30000.00"),
                max_digits=12,
            ),
        ),
    ]
